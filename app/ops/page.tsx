'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { useSchedule } from '@/lib/hooks'
import { AssignDropdown } from '@/components/AssignDropdown'
import { WeMaintainLogo } from '@/components/WeMaintainLogo'
import { fetcher } from '@/lib/swr'

type ViewMode = 'calendar' | 'list'

export default function OpsPage() {
  // Initialize with default, then sync from localStorage after mount
  const [country, setCountry] = useState('FR')
  
  // Sync country from localStorage immediately after component mounts
  useEffect(() => {
    const savedCountry = localStorage.getItem('selectedCountry')
    if (savedCountry && (savedCountry === 'FR' || savedCountry === 'GB' || savedCountry === 'SG')) {
      setCountry(savedCountry)
    }
  }, [])
  
  // Persist country selection to localStorage
  const handleCountryChange = (code: string) => {
    setCountry(code)
    localStorage.setItem('selectedCountry', code)
  }
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [dateOffset, setDateOffset] = useState(0) // Offset in days for navigation
  const todayColumnRef = useRef<HTMLTableCellElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasScrolledToToday = useRef(false) // Track if we've already scrolled to today
  
  // Calculate date range: 2 weeks ago to 2 weeks ahead (4 weeks total)
  // Use UTC dates to match database storage
  const baseToday = new Date()
  baseToday.setUTCHours(0, 0, 0, 0)
  const today = new Date(Date.UTC(
    baseToday.getUTCFullYear(),
    baseToday.getUTCMonth(),
    baseToday.getUTCDate() + dateOffset,
    0, 0, 0, 0
  ))
  
  const fromDate = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate() - 14,
    0, 0, 0, 0
  ))
  const toDate = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate() + 14,
    23, 59, 59, 999
  ))

  const from = fromDate.toISOString().split('T')[0]
  const to = toDate.toISOString().split('T')[0]

  const { shifts, isLoading, isError, mutate } = useSchedule(country, from, to)

  // Fetch all sectors for the country (not just those with shifts)
  const { data: sectorsData } = useSWR(
    `/api/sectors?country=${country}`,
    fetcher
  )

  // Group shifts by sector and date
  const shiftsBySectorAndDate: Record<string, Record<string, any[]>> = {}
  
  if (shifts && Array.isArray(shifts)) {
    shifts.forEach((shift: any) => {
      const sectorId = shift.sector?.id || 'unknown'
      // Ensure we use UTC date to avoid timezone shifts
      const shiftDate = new Date(shift.date)
      const dateKey = shiftDate.toISOString().split('T')[0]
      
      if (!shiftsBySectorAndDate[sectorId]) {
        shiftsBySectorAndDate[sectorId] = {}
      }
      if (!shiftsBySectorAndDate[sectorId][dateKey]) {
        shiftsBySectorAndDate[sectorId][dateKey] = []
      }
      shiftsBySectorAndDate[sectorId][dateKey].push(shift)
    })
  }

  // Use all sectors for the country, not just those with shifts
  // This ensures new sectors appear even without shifts
  const allSectors = sectorsData?.sectors || []
  const sectors = allSectors
    .filter((s: any) => s.active !== false)
    .sort((a: any, b: any) => a.name.localeCompare(b.name))

  // Generate date columns (past 2 weeks, current week, next 2 weeks)
  // Use UTC dates to match database storage
  const dateColumns: Date[] = []
  for (let i = -14; i <= 14; i++) {
    const date = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + i,
      0, 0, 0, 0
    ))
    dateColumns.push(date)
  }

  // Auto-scroll to today's date only when page first loads
  useEffect(() => {
    // Only scroll on initial page load, not on subsequent renders
    if (viewMode === 'calendar' && !hasScrolledToToday.current) {
      // Wait for table to render and shifts to load, then scroll
      const timeoutId = setTimeout(() => {
        const container = scrollContainerRef.current
        const todayCell = todayColumnRef.current
        
        if (container && todayCell && !hasScrolledToToday.current) {
          // Calculate scroll position to center today's column horizontally
          const containerRect = container.getBoundingClientRect()
          const cellRect = todayCell.getBoundingClientRect()
          const scrollLeft = cellRect.left - containerRect.left + container.scrollLeft - (containerRect.width / 2) + (cellRect.width / 2)
          
          container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
          })
          
          hasScrolledToToday.current = true // Mark as scrolled - only once per page load
        }
      }, 300) // Slightly longer delay to ensure table is fully rendered
      
      return () => clearTimeout(timeoutId)
    }
  }, [viewMode, shifts]) // Depend on shifts to ensure data is loaded before scrolling

  const handlePrevious30Days = () => {
    setDateOffset(prev => prev - 30)
  }

  const handleNext30Days = () => {
    setDateOffset(prev => prev + 30)
  }

  const handleResetToToday = () => {
    setDateOffset(0)
  }

  // Get actual today (without offset) for highlighting
  const actualToday = new Date()
  actualToday.setUTCHours(0, 0, 0, 0)

  const formatDateHeader = (date: Date) => {
    // Compare UTC dates to avoid timezone issues - compare with actual today, not offset today
    const isToday = date.getUTCFullYear() === actualToday.getUTCFullYear() &&
                    date.getUTCMonth() === actualToday.getUTCMonth() &&
                    date.getUTCDate() === actualToday.getUTCDate()
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNum = date.getUTCDate()
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    
    return (
      <div className={`text-center ${isToday ? 'font-bold text-blue-900' : 'text-gray-900'}`}>
        <div className={`text-xs font-medium ${isToday ? 'text-blue-900' : ''}`}>{dayName}</div>
        <div className={`text-sm font-semibold ${isToday ? 'text-blue-900' : ''}`}>{dayNum}</div>
        <div className={`text-xs ${isToday ? 'text-blue-800' : 'text-gray-700'}`}>{month}</div>
      </div>
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const isPublicHoliday = (date: Date) => {
    // Check if date matches any holiday (simplified - you might want to fetch holidays)
    return false
  }

  const countryLabels: Record<string, string> = {
    FR: 'France',
    GB: 'United Kingdom',
    SG: 'Singapore',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <WeMaintainLogo />
        </div>
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <div className="px-3 py-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Operations
            </div>
            <a
              href="/ops"
              className="block px-3 py-2 rounded-md bg-slate-700 text-white font-medium"
            >
              Schedule
            </a>
            <a
              href="/admin"
              className="block px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Shift Management
            </a>
            <a
              href="/payroll"
              className="block px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Overtime Pay Extract
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Shift & Standby Scheduling</h1>
              <div className="text-sm text-gray-600">
                Today: {actualToday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* Warning for unassigned shifts in next 7 days */}
            {useMemo(() => {
              if (!shifts || !Array.isArray(shifts)) return null
              const next7Days = new Date()
              next7Days.setUTCDate(next7Days.getUTCDate() + 7)
              const today = new Date()
              today.setUTCHours(0, 0, 0, 0)
              const unassignedInNext7Days = shifts.filter((shift: any) => {
                const shiftDate = new Date(shift.date)
                const assignedEngineer = shift.assignments?.[0]?.engineer
                return shiftDate >= today && 
                       shiftDate <= next7Days && 
                       !assignedEngineer &&
                       shift.status === 'UNASSIGNED' &&
                       shift.countryCode === country
              })
              if (unassignedInNext7Days.length > 0) {
                return (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm font-medium text-yellow-800">
                      ⚠️ Warning: {unassignedInNext7Days.length} unassigned shift{unassignedInNext7Days.length > 1 ? 's' : ''} in the next 7 days
                    </p>
                  </div>
                )
              }
              return null
            }, [shifts, country])}
            
            {/* Country Filter and View Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {(['FR', 'GB', 'SG'] as const).map((code) => (
                  <button
                    key={code}
                    onClick={() => handleCountryChange(code)}
                    className={`px-4 py-1.5 rounded-md font-medium transition-colors ${
                      country === code
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {countryLabels[code]}
                  </button>
                ))}
            </div>
              
              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-white rounded-md border border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-1.5 rounded-md font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Calendar
                </button>
              <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-1.5 rounded-md font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  List
              </button>
            </div>
          </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm mb-4 bg-white p-3 rounded-md border border-gray-200">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 3.34998C12.4265 3.34998 12.8493 3.38089 13.2661 3.44206C17.4851 4.06125 20.65 7.69429 20.65 12C20.65 16.373 17.3874 20.0435 13.0853 20.5825C12.7271 20.6273 12.3649 20.65 12 20.65C11.641 20.65 11.35 20.359 11.35 20C11.35 19.641 11.641 19.35 12 19.35C12.3108 19.35 12.6191 19.3307 12.9237 19.2926C16.5774 18.8349 19.35 15.7156 19.35 12C19.35 8.34163 16.6604 5.25413 13.0773 4.72828C12.7229 4.67627 12.3632 4.64998 12 4.64998C11.6855 4.64998 11.3737 4.66969 11.0656 4.70874C7.41684 5.17127 4.65001 8.28836 4.65001 12C4.65001 14.355 5.76659 16.514 7.59158 17.8823L7.59265 15C7.59265 14.641 7.88366 14.35 8.24265 14.35C8.60163 14.35 8.89265 14.641 8.89265 15V19.2426C8.89265 19.6016 8.60163 19.8926 8.24265 19.8926H4.00001C3.64102 19.8926 3.35001 19.6016 3.35001 19.2426C3.35001 18.8836 3.64102 18.5926 4.00001 18.5926L6.39859 18.5925C4.49715 16.9769 3.35001 14.5886 3.35001 12C3.35001 7.6316 6.60577 3.96368 10.9021 3.41906C11.2644 3.37314 11.6308 3.34998 12 3.34998Z" fill="black"/>
                </svg>
                <span className="text-gray-900 font-medium">Recurring Shift</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_532_570)">
                    <path d="M6.58002 14.79H10.71C10.8824 14.79 11.0477 14.7215 11.1696 14.5996C11.2915 14.4777 11.36 14.3124 11.36 14.14C11.36 13.9676 11.2915 13.8023 11.1696 13.6804C11.0477 13.5585 10.8824 13.49 10.71 13.49H6.58002C6.40763 13.49 6.24232 13.5585 6.12042 13.6804C5.99852 13.8023 5.92999 13.9676 5.92999 14.14C5.92999 14.3124 5.99852 14.4777 6.12042 14.5996C6.24232 14.7215 6.40763 14.79 6.58002 14.79Z" fill="black"/>
                    <path d="M10.66 16.96H6.66003C6.48764 16.96 6.32228 17.0285 6.20038 17.1504C6.07848 17.2723 6.01001 17.4376 6.01001 17.61C6.01001 17.7824 6.07848 17.9477 6.20038 18.0696C6.32228 18.1915 6.48764 18.26 6.66003 18.26H10.66C10.8324 18.26 10.9977 18.1915 11.1196 18.0696C11.2415 17.9477 11.31 17.7824 11.31 17.61C11.31 17.4376 11.2415 17.2723 11.1196 17.1504C10.9977 17.0285 10.8324 16.96 10.66 16.96Z" fill="black"/>
                    <path d="M13.01 6.83001C13.6838 6.83001 14.23 6.2838 14.23 5.61001C14.23 4.93623 13.6838 4.39001 13.01 4.39001C12.3362 4.39001 11.79 4.93623 11.79 5.61001C11.79 6.2838 12.3362 6.83001 13.01 6.83001Z" fill="black"/>
                    <path d="M21.7 20.94H20.22V15.94C20.2174 15.5828 20.0743 15.2409 19.8217 14.9883C19.5691 14.7357 19.2272 14.5926 18.87 14.59H14.19V12.72C13.8526 12.983 13.4378 13.1272 13.01 13.13H12.89V20.95H4.46002V10.95H10.46C10.18 10.54 9.87004 10.08 9.54004 9.61002H4.54004C4.182 9.61002 3.83862 9.75223 3.58545 10.0054C3.33228 10.2586 3.19 10.6019 3.19 10.96V20.96H1.67999C1.5076 20.96 1.3423 21.0285 1.2204 21.1504C1.0985 21.2723 1.03003 21.4376 1.03003 21.61C1.03003 21.7824 1.0985 21.9477 1.2204 22.0696C1.3423 22.1915 1.5076 22.26 1.67999 22.26H21.68C21.8524 22.26 22.0177 22.1915 22.1396 22.0696C22.2615 21.9477 22.33 21.7824 22.33 21.61C22.33 21.4376 22.2615 21.2723 22.1396 21.1504C22.0177 21.0285 21.8524 20.96 21.68 20.96L21.7 20.94ZM18.92 20.94H14.19V15.94H18.92V20.94Z" fill="black"/>
                    <path d="M13.01 6.83001C13.6838 6.83001 14.23 6.2838 14.23 5.61001C14.23 4.93623 13.6838 4.39001 13.01 4.39001C12.3362 4.39001 11.79 4.93623 11.79 5.61001C11.79 6.2838 12.3362 6.83001 13.01 6.83001Z" fill="black"/>
                    <path d="M13 12.3L12.48 11.55C12.48 11.55 10.85 9.23002 9.61997 7.42002C9.27408 6.85918 9.07215 6.22158 9.03202 5.56388C8.9919 4.90618 9.11485 4.24873 9.38999 3.65C9.72541 2.98362 10.2445 2.42714 10.8859 2.04618C11.5273 1.66522 12.2644 1.47571 13.01 1.50003C13.8288 1.48894 14.6313 1.72939 15.3091 2.189C15.9869 2.6486 16.5073 3.30521 16.8 4.07004C16.9953 4.67809 17.0472 5.32303 16.9518 5.9545C16.8564 6.58597 16.6162 7.18679 16.25 7.71C15.25 9.28 13.54 11.54 13.52 11.57L13 12.3ZM13 2.80002C12.493 2.775 11.9897 2.89778 11.5512 3.15342C11.1128 3.40905 10.758 3.78654 10.53 4.24002C10.3587 4.63141 10.2838 5.05815 10.3117 5.48447C10.3395 5.91079 10.4692 6.32425 10.69 6.69004C11.48 7.86004 12.43 9.23003 13.01 10.06C13.59 9.27003 14.51 7.98001 15.18 6.98001C15.4258 6.62762 15.5894 6.22455 15.6586 5.80051C15.7278 5.37647 15.701 4.94228 15.58 4.53C15.3869 4.00998 15.0366 3.56302 14.5779 3.25119C14.1191 2.93937 13.5746 2.77817 13.02 2.79001L13 2.80002Z" fill="black"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_532_570">
                      <rect width="21.35" height="20.74" fill="white" transform="translate(1 1.5)"/>
                    </clipPath>
                  </defs>
                </svg>
                <span className="text-gray-900 font-medium">Onsite</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M21.2184 19.6053C21.1545 19.6684 21.0775 19.7435 20.9317 19.8853C20.6018 20.2004 20.3876 20.4198 20.149 20.6987C19.4619 21.4344 18.6011 21.8 17.5724 21.8C17.5197 21.8 17.5197 21.8 17.4519 21.7993C17.3771 21.7977 17.3771 21.7977 17.2903 21.793C16.0019 21.7105 14.8317 21.3222 13.4321 20.652C10.8159 19.384 8.51997 17.5839 6.61301 15.3048C5.04959 13.4182 3.98737 11.6468 3.28125 9.73655C2.81917 8.49786 2.63666 7.47158 2.71946 6.46027C2.78878 5.6483 3.11644 4.94198 3.69195 4.36579L5.19657 2.86027C5.63474 2.44843 6.16199 2.20001 6.74445 2.20001C7.38309 2.20001 7.8868 2.47583 8.29355 2.88222C8.5376 3.11119 8.76629 3.34041 9.1161 3.70235L9.10196 3.68751C9.16526 3.75293 9.43973 4.03205 9.49847 4.09292L10.6795 5.27534C11.645 6.242 11.645 7.48872 10.6795 8.45539C10.6384 8.49653 10.5919 8.54358 10.4974 8.63923C10.4165 8.72096 10.3548 8.78239 10.3182 8.81699C9.92999 9.21489 9.63724 9.50462 9.37238 9.74826C9.61971 10.2827 9.96262 10.8199 10.4739 11.4716L10.4796 11.478C11.5888 12.846 12.7434 13.8981 14.0081 14.6988C14.0432 14.7211 14.0817 14.7439 14.1247 14.768C14.2007 14.8105 14.2681 14.8453 14.4253 14.924C14.5275 14.9752 14.6073 15.0155 14.6753 15.0512L15.9691 13.7558C16.3886 13.3359 16.8938 13.0497 17.5421 13.0497C18.1995 13.0497 18.7286 13.354 19.0849 13.7472L19.0935 13.7558L21.4727 16.1379C22.423 17.0801 22.4289 18.3419 21.5077 19.3084C21.4186 19.4042 21.327 19.4978 21.2184 19.6053ZM20.5617 18.4167C21.0029 17.9576 21.0029 17.5028 20.5574 17.061L18.1651 14.6659C18.031 14.5186 17.8103 14.3497 17.5421 14.3497C17.2696 14.3497 17.036 14.5273 16.8889 14.6745L15.4094 16.1558C15.3359 16.2294 15.1109 16.4547 14.7519 16.4547C14.6091 16.4547 14.4707 16.42 14.3236 16.3464L14.2717 16.3161C14.1462 16.2381 13.9991 16.1645 13.8434 16.0865C13.6704 15.9999 13.4887 15.9089 13.3113 15.7963C11.9227 14.9171 10.6638 13.7693 9.46983 12.2967L9.4655 12.2924C8.80795 11.4564 8.37535 10.7548 8.06821 10.0098L8.05523 9.97084C7.97736 9.72396 7.90815 9.36014 8.28018 8.98766C8.28451 8.97899 8.29316 8.97466 8.30181 8.966C8.67817 8.62817 9.02425 8.28167 9.38764 7.90918C9.51309 7.78791 9.63422 7.66231 9.75967 7.5367C10.2182 7.07759 10.2182 6.65313 9.75967 6.19402L8.57867 5.0116C8.44024 4.86867 8.30181 4.73008 8.16771 4.59148C7.90382 4.31861 7.65291 4.06307 7.38903 3.81619L7.37605 3.8032C7.23762 3.6646 7.01699 3.50001 6.74445 3.50001C6.52383 3.50001 6.29888 3.60829 6.0869 3.80753L4.61174 5.28447C4.25268 5.64396 4.05801 6.06409 4.01475 6.57084C3.94986 7.36345 4.09694 8.20371 4.49926 9.28218C5.15249 11.0493 6.13881 12.6952 7.61398 14.4753C9.40061 16.6106 11.5506 18.2954 13.9991 19.4822C14.8946 19.911 16.0886 20.4134 17.3734 20.4957C17.4383 20.5 17.5075 20.5 17.5724 20.5C18.2473 20.5 18.7621 20.2791 19.199 19.8113C19.4672 19.4952 19.7527 19.2136 20.0339 18.9451C20.2199 18.7632 20.393 18.5986 20.5617 18.4167Z" fill="black"/>
                </svg>
                <span className="text-gray-900 font-medium">Remote</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-100 border-2 border-pink-500 border-dashed rounded"></div>
                <span className="text-gray-900 font-semibold">Unassigned (Action)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
                <span className="text-gray-900 font-medium">Public Holiday</span>
            </div>
          </div>
        </div>

          {/* Content */}
          {isLoading ? (
            <div className="p-8 text-center text-gray-700 bg-white rounded-lg shadow-sm">
              Loading schedule...
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-700 bg-white rounded-lg shadow-sm">
              Error loading schedule. Please try again.
            </div>
          ) : viewMode === 'calendar' ? (
            /* Calendar Grid View */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Navigation buttons - fixed above the scrollable table */}
              <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <button
                  onClick={handlePrevious30Days}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Previous 30 days"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous 30 days</span>
                </button>
                {dateOffset !== 0 && (
                  <button
                    onClick={handleResetToToday}
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    title="Reset to today"
                  >
                    Today
                  </button>
                )}
                <button
                  onClick={handleNext30Days}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Next 30 days"
                >
                  <span>Next 30 days</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div ref={scrollContainerRef} className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 border-r border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 min-w-[150px]">
                      Sector
                    </th>
                    {dateColumns.map((date, index) => {
                      const isToday = date.getUTCFullYear() === actualToday.getUTCFullYear() &&
                                      date.getUTCMonth() === actualToday.getUTCMonth() &&
                                      date.getUTCDate() === actualToday.getUTCDate()
                      return (
                        <th
                          key={date.toISOString()}
                          ref={isToday ? todayColumnRef : null}
                          className={`border-b border-gray-300 px-2 py-2 text-center min-w-[140px] ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}
                        >
                          {formatDateHeader(date)}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sectors.map((sector: any) => (
                    <tr key={sector.id} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white border-r border-gray-300 px-3 py-2 font-medium text-gray-900">
                        {sector.name}
                      </td>
                      {dateColumns.map((date) => {
                        const dateKey = date.toISOString().split('T')[0]
                        const sectorShifts = shiftsBySectorAndDate[sector.id]?.[dateKey] || []
                        const isHoliday = isPublicHoliday(date)
                        const isToday = date.getUTCFullYear() === actualToday.getUTCFullYear() &&
                                        date.getUTCMonth() === actualToday.getUTCMonth() &&
                                        date.getUTCDate() === actualToday.getUTCDate()
                        
                        return (
                          <td
                            key={`${sector.id}-${dateKey}`}
                            className={`border border-gray-200 px-1 py-1 align-top min-h-[80px] min-w-[140px] ${isToday ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                          >
                            {isHoliday ? (
                              <div className="text-xs text-red-700 font-semibold text-center py-1">
                                Public Holiday
                              </div>
                            ) : sectorShifts.length === 0 ? (
                              <div className="text-center text-gray-500 py-1 text-xs">—</div>
                            ) : (
                              <div className="space-y-1">
                                {sectorShifts.map((shift: any) => {
                                  const assignedEngineer = shift.assignments?.[0]?.engineer
                                  const isUnassigned = !assignedEngineer && shift.status === 'UNASSIGNED'
                                  const isCompleted = shift.status === 'COMPLETED'
                                  
                                  const shiftName = shift.recurringShift?.name || 'Shift'
                                  
                                  return (
                                    <div
                                      key={shift.id}
                                      className={`p-1.5 rounded border text-xs relative ${
                                        isUnassigned
                                          ? 'bg-pink-50 border-2 border-pink-500 border-dashed'
                                          : 'bg-white border border-gray-300'
                                      }`}
                                    >
                                      {/* Icons in top left corner */}
                                      <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                                        {shift.recurringShift && (
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M12 3.34998C12.4265 3.34998 12.8493 3.38089 13.2661 3.44206C17.4851 4.06125 20.65 7.69429 20.65 12C20.65 16.373 17.3874 20.0435 13.0853 20.5825C12.7271 20.6273 12.3649 20.65 12 20.65C11.641 20.65 11.35 20.359 11.35 20C11.35 19.641 11.641 19.35 12 19.35C12.3108 19.35 12.6191 19.3307 12.9237 19.2926C16.5774 18.8349 19.35 15.7156 19.35 12C19.35 8.34163 16.6604 5.25413 13.0773 4.72828C12.7229 4.67627 12.3632 4.64998 12 4.64998C11.6855 4.64998 11.3737 4.66969 11.0656 4.70874C7.41684 5.17127 4.65001 8.28836 4.65001 12C4.65001 14.355 5.76659 16.514 7.59158 17.8823L7.59265 15C7.59265 14.641 7.88366 14.35 8.24265 14.35C8.60163 14.35 8.89265 14.641 8.89265 15V19.2426C8.89265 19.6016 8.60163 19.8926 8.24265 19.8926H4.00001C3.64102 19.8926 3.35001 19.6016 3.35001 19.2426C3.35001 18.8836 3.64102 18.5926 4.00001 18.5926L6.39859 18.5925C4.49715 16.9769 3.35001 14.5886 3.35001 12C3.35001 7.6316 6.60577 3.96368 10.9021 3.41906C11.2644 3.37314 11.6308 3.34998 12 3.34998Z" fill="black"/>
                                          </svg>
                                        )}
                                        {shift.type === 'REMOTE' ? (
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M21.2184 19.6053C21.1545 19.6684 21.0775 19.7435 20.9317 19.8853C20.6018 20.2004 20.3876 20.4198 20.149 20.6987C19.4619 21.4344 18.6011 21.8 17.5724 21.8C17.5197 21.8 17.5197 21.8 17.4519 21.7993C17.3771 21.7977 17.3771 21.7977 17.2903 21.793C16.0019 21.7105 14.8317 21.3222 13.4321 20.652C10.8159 19.384 8.51997 17.5839 6.61301 15.3048C5.04959 13.4182 3.98737 11.6468 3.28125 9.73655C2.81917 8.49786 2.63666 7.47158 2.71946 6.46027C2.78878 5.6483 3.11644 4.94198 3.69195 4.36579L5.19657 2.86027C5.63474 2.44843 6.16199 2.20001 6.74445 2.20001C7.38309 2.20001 7.8868 2.47583 8.29355 2.88222C8.5376 3.11119 8.76629 3.34041 9.1161 3.70235L9.10196 3.68751C9.16526 3.75293 9.43973 4.03205 9.49847 4.09292L10.6795 5.27534C11.645 6.242 11.645 7.48872 10.6795 8.45539C10.6384 8.49653 10.5919 8.54358 10.4974 8.63923C10.4165 8.72096 10.3548 8.78239 10.3182 8.81699C9.92999 9.21489 9.63724 9.50462 9.37238 9.74826C9.61971 10.2827 9.96262 10.8199 10.4739 11.4716L10.4796 11.478C11.5888 12.846 12.7434 13.8981 14.0081 14.6988C14.0432 14.7211 14.0817 14.7439 14.1247 14.768C14.2007 14.8105 14.2681 14.8453 14.4253 14.924C14.5275 14.9752 14.6073 15.0155 14.6753 15.0512L15.9691 13.7558C16.3886 13.3359 16.8938 13.0497 17.5421 13.0497C18.1995 13.0497 18.7286 13.354 19.0849 13.7472L19.0935 13.7558L21.4727 16.1379C22.423 17.0801 22.4289 18.3419 21.5077 19.3084C21.4186 19.4042 21.327 19.4978 21.2184 19.6053ZM20.5617 18.4167C21.0029 17.9576 21.0029 17.5028 20.5574 17.061L18.1651 14.6659C18.031 14.5186 17.8103 14.3497 17.5421 14.3497C17.2696 14.3497 17.036 14.5273 16.8889 14.6745L15.4094 16.1558C15.3359 16.2294 15.1109 16.4547 14.7519 16.4547C14.6091 16.4547 14.4707 16.42 14.3236 16.3464L14.2717 16.3161C14.1462 16.2381 13.9991 16.1645 13.8434 16.0865C13.6704 15.9999 13.4887 15.9089 13.3113 15.7963C11.9227 14.9171 10.6638 13.7693 9.46983 12.2967L9.4655 12.2924C8.80795 11.4564 8.37535 10.7548 8.06821 10.0098L8.05523 9.97084C7.97736 9.72396 7.90815 9.36014 8.28018 8.98766C8.28451 8.97899 8.29316 8.97466 8.30181 8.966C8.67817 8.62817 9.02425 8.28167 9.38764 7.90918C9.51309 7.78791 9.63422 7.66231 9.75967 7.5367C10.2182 7.07759 10.2182 6.65313 9.75967 6.19402L8.57867 5.0116C8.44024 4.86867 8.30181 4.73008 8.16771 4.59148C7.90382 4.31861 7.65291 4.06307 7.38903 3.81619L7.37605 3.8032C7.23762 3.6646 7.01699 3.50001 6.74445 3.50001C6.52383 3.50001 6.29888 3.60829 6.0869 3.80753L4.61174 5.28447C4.25268 5.64396 4.05801 6.06409 4.01475 6.57084C3.94986 7.36345 4.09694 8.20371 4.49926 9.28218C5.15249 11.0493 6.13881 12.6952 7.61398 14.4753C9.40061 16.6106 11.5506 18.2954 13.9991 19.4822C14.8946 19.911 16.0886 20.4134 17.3734 20.4957C17.4383 20.5 17.5075 20.5 17.5724 20.5C18.2473 20.5 18.7621 20.2791 19.199 19.8113C19.4672 19.4952 19.7527 19.2136 20.0339 18.9451C20.2199 18.7632 20.393 18.5986 20.5617 18.4167Z" fill="black"/>
                                          </svg>
                                        ) : (
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <g clipPath="url(#clip0_onsite)">
                                              <path d="M6.58002 14.79H10.71C10.8824 14.79 11.0477 14.7215 11.1696 14.5996C11.2915 14.4777 11.36 14.3124 11.36 14.14C11.36 13.9676 11.2915 13.8023 11.1696 13.6804C11.0477 13.5585 10.8824 13.49 10.71 13.49H6.58002C6.40763 13.49 6.24232 13.5585 6.12042 13.6804C5.99852 13.8023 5.92999 13.9676 5.92999 14.14C5.92999 14.3124 5.99852 14.4777 6.12042 14.5996C6.24232 14.7215 6.40763 14.79 6.58002 14.79Z" fill="black"/>
                                              <path d="M10.66 16.96H6.66003C6.48764 16.96 6.32228 17.0285 6.20038 17.1504C6.07848 17.2723 6.01001 17.4376 6.01001 17.61C6.01001 17.7824 6.07848 17.9477 6.20038 18.0696C6.32228 18.1915 6.48764 18.26 6.66003 18.26H10.66C10.8324 18.26 10.9977 18.1915 11.1196 18.0696C11.2415 17.9477 11.31 17.7824 11.31 17.61C11.31 17.4376 11.2415 17.2723 11.1196 17.1504C10.9977 17.0285 10.8324 16.96 10.66 16.96Z" fill="black"/>
                                              <path d="M13.01 6.83001C13.6838 6.83001 14.23 6.2838 14.23 5.61001C14.23 4.93623 13.6838 4.39001 13.01 4.39001C12.3362 4.39001 11.79 4.93623 11.79 5.61001C11.79 6.2838 12.3362 6.83001 13.01 6.83001Z" fill="black"/>
                                              <path d="M21.7 20.94H20.22V15.94C20.2174 15.5828 20.0743 15.2409 19.8217 14.9883C19.5691 14.7357 19.2272 14.5926 18.87 14.59H14.19V12.72C13.8526 12.983 13.4378 13.1272 13.01 13.13H12.89V20.95H4.46002V10.95H10.46C10.18 10.54 9.87004 10.08 9.54004 9.61002H4.54004C4.182 9.61002 3.83862 9.75223 3.58545 10.0054C3.33228 10.2586 3.19 10.6019 3.19 10.96V20.96H1.67999C1.5076 20.96 1.3423 21.0285 1.2204 21.1504C1.0985 21.2723 1.03003 21.4376 1.03003 21.61C1.03003 21.7824 1.0985 21.9477 1.2204 22.0696C1.3423 22.1915 1.5076 22.26 1.67999 22.26H21.68C21.8524 22.26 22.0177 22.1915 22.1396 22.0696C22.2615 21.9477 22.33 21.7824 22.33 21.61C22.33 21.4376 22.2615 21.2723 22.1396 21.1504C22.0177 21.0285 21.8524 20.96 21.68 20.96L21.7 20.94ZM18.92 20.94H14.19V15.94H18.92V20.94Z" fill="black"/>
                                              <path d="M13 12.3L12.48 11.55C12.48 11.55 10.85 9.23002 9.61997 7.42002C9.27408 6.85918 9.07215 6.22158 9.03202 5.56388C8.9919 4.90618 9.11485 4.24873 9.38999 3.65C9.72541 2.98362 10.2445 2.42714 10.8859 2.04618C11.5273 1.66522 12.2644 1.47571 13.01 1.50003C13.8288 1.48894 14.6313 1.72939 15.3091 2.189C15.9869 2.6486 16.5073 3.30521 16.8 4.07004C16.9953 4.67809 17.0472 5.32303 16.9518 5.9545C16.8564 6.58597 16.6162 7.18679 16.25 7.71C15.25 9.28 13.54 11.54 13.52 11.57L13 12.3ZM13 2.80002C12.493 2.775 11.9897 2.89778 11.5512 3.15342C11.1128 3.40905 10.758 3.78654 10.53 4.24002C10.3587 4.63141 10.2838 5.05815 10.3117 5.48447C10.3395 5.91079 10.4692 6.32425 10.69 6.69004C11.48 7.86004 12.43 9.23003 13.01 10.06C13.59 9.27003 14.51 7.98001 15.18 6.98001C15.4258 6.62762 15.5894 6.22455 15.6586 5.80051C15.7278 5.37647 15.701 4.94228 15.58 4.53C15.3869 4.00998 15.0366 3.56302 14.5779 3.25119C14.1191 2.93937 13.5746 2.77817 13.02 2.79001L13 2.80002Z" fill="black"/>
                                            </g>
                                            <defs>
                                              <clipPath id="clip0_onsite">
                                                <rect width="21.35" height="20.74" fill="white" transform="translate(1 1.5)"/>
                                              </clipPath>
                                            </defs>
                                          </svg>
                                        )}
                                      </div>
                                      
                                      {/* Shift name */}
                                      <div className={`text-xs font-medium mb-0.5 text-gray-900 pr-4 ${shift.recurringShift || shift.type ? 'pl-5' : ''}`}>
                                        {shiftName}
                                      </div>
                                      {/* Always show times */}
                                      <div className="text-xs text-gray-800 mb-1 font-medium">
                                        {formatTime(shift.plannedStart)} → {formatTime(shift.plannedEnd)}
                                      </div>
                                      {shift.performedStart && shift.performedEnd && (
                                        <div className="text-xs text-gray-700 mb-1">
                                          Performed: {formatTime(shift.performedStart)} → {formatTime(shift.performedEnd)}
                                        </div>
                                      )}
                                      <div className={`text-xs font-semibold mb-1 ${
                                        isCompleted ? 'text-green-700' : 'text-yellow-700'
                                      }`}>
                                        {shift.status.toLowerCase()}
                                      </div>
                                      <div className="mt-1">
                                        <AssignDropdown
                                          shiftId={shift.id}
                                          currentEngineerId={assignedEngineer?.id}
                                          countryCode={shift.countryCode}
                                          sectorId={shift.sectorId}
                                          plannedStart={shift.plannedStart}
                                          plannedEnd={shift.plannedEnd}
                                          onAssign={() => mutate()}
                                        />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Date
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Sector
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Shift Name
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Time
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Engineer
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shifts && Array.isArray(shifts) && shifts.length > 0 ? (
                      shifts
                        .filter((shift: any) => shift.countryCode === country)
                        .map((shift: any) => {
                    const assignedEngineer = shift.assignments?.[0]?.engineer
                        const isUnassigned = !assignedEngineer && shift.status === 'UNASSIGNED'
                        const shiftName = shift.recurringShift?.name || 'Shift'
                        
                    return (
                      <tr
                        key={shift.id}
                            className={`hover:bg-gray-50 ${
                              isUnassigned ? 'bg-pink-50' : ''
                            }`}
                      >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(shift.date)}
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {shift.sector?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{shiftName}</span>
                            {shift.type === 'REMOTE' ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M21.2184 19.6053C21.1545 19.6684 21.0775 19.7435 20.9317 19.8853C20.6018 20.2004 20.3876 20.4198 20.149 20.6987C19.4619 21.4344 18.6011 21.8 17.5724 21.8C17.5197 21.8 17.5197 21.8 17.4519 21.7993C17.3771 21.7977 17.3771 21.7977 17.2903 21.793C16.0019 21.7105 14.8317 21.3222 13.4321 20.652C10.8159 19.384 8.51997 17.5839 6.61301 15.3048C5.04959 13.4182 3.98737 11.6468 3.28125 9.73655C2.81917 8.49786 2.63666 7.47158 2.71946 6.46027C2.78878 5.6483 3.11644 4.94198 3.69195 4.36579L5.19657 2.86027C5.63474 2.44843 6.16199 2.20001 6.74445 2.20001C7.38309 2.20001 7.8868 2.47583 8.29355 2.88222C8.5376 3.11119 8.76629 3.34041 9.1161 3.70235L9.10196 3.68751C9.16526 3.75293 9.43973 4.03205 9.49847 4.09292L10.6795 5.27534C11.645 6.242 11.645 7.48872 10.6795 8.45539C10.6384 8.49653 10.5919 8.54358 10.4974 8.63923C10.4165 8.72096 10.3548 8.78239 10.3182 8.81699C9.92999 9.21489 9.63724 9.50462 9.37238 9.74826C9.61971 10.2827 9.96262 10.8199 10.4739 11.4716L10.4796 11.478C11.5888 12.846 12.7434 13.8981 14.0081 14.6988C14.0432 14.7211 14.0817 14.7439 14.1247 14.768C14.2007 14.8105 14.2681 14.8453 14.4253 14.924C14.5275 14.9752 14.6073 15.0155 14.6753 15.0512L15.9691 13.7558C16.3886 13.3359 16.8938 13.0497 17.5421 13.0497C18.1995 13.0497 18.7286 13.354 19.0849 13.7472L19.0935 13.7558L21.4727 16.1379C22.423 17.0801 22.4289 18.3419 21.5077 19.3084C21.4186 19.4042 21.327 19.4978 21.2184 19.6053ZM20.5617 18.4167C21.0029 17.9576 21.0029 17.5028 20.5574 17.061L18.1651 14.6659C18.031 14.5186 17.8103 14.3497 17.5421 14.3497C17.2696 14.3497 17.036 14.5273 16.8889 14.6745L15.4094 16.1558C15.3359 16.2294 15.1109 16.4547 14.7519 16.4547C14.6091 16.4547 14.4707 16.42 14.3236 16.3464L14.2717 16.3161C14.1462 16.2381 13.9991 16.1645 13.8434 16.0865C13.6704 15.9999 13.4887 15.9089 13.3113 15.7963C11.9227 14.9171 10.6638 13.7693 9.46983 12.2967L9.4655 12.2924C8.80795 11.4564 8.37535 10.7548 8.06821 10.0098L8.05523 9.97084C7.97736 9.72396 7.90815 9.36014 8.28018 8.98766C8.28451 8.97899 8.29316 8.97466 8.30181 8.966C8.67817 8.62817 9.02425 8.28167 9.38764 7.90918C9.51309 7.78791 9.63422 7.66231 9.75967 7.5367C10.2182 7.07759 10.2182 6.65313 9.75967 6.19402L8.57867 5.0116C8.44024 4.86867 8.30181 4.73008 8.16771 4.59148C7.90382 4.31861 7.65291 4.06307 7.38903 3.81619L7.37605 3.8032C7.23762 3.6646 7.01699 3.50001 6.74445 3.50001C6.52383 3.50001 6.29888 3.60829 6.0869 3.80753L4.61174 5.28447C4.25268 5.64396 4.05801 6.06409 4.01475 6.57084C3.94986 7.36345 4.09694 8.20371 4.49926 9.28218C5.15249 11.0493 6.13881 12.6952 7.61398 14.4753C9.40061 16.6106 11.5506 18.2954 13.9991 19.4822C14.8946 19.911 16.0886 20.4134 17.3734 20.4957C17.4383 20.5 17.5075 20.5 17.5724 20.5C18.2473 20.5 18.7621 20.2791 19.199 19.8113C19.4672 19.4952 19.7527 19.2136 20.0339 18.9451C20.2199 18.7632 20.393 18.5986 20.5617 18.4167Z" fill="black"/>
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_list_onsite)">
                                  <path d="M6.58002 14.79H10.71C10.8824 14.79 11.0477 14.7215 11.1696 14.5996C11.2915 14.4777 11.36 14.3124 11.36 14.14C11.36 13.9676 11.2915 13.8023 11.1696 13.6804C11.0477 13.5585 10.8824 13.49 10.71 13.49H6.58002C6.40763 13.49 6.24232 13.5585 6.12042 13.6804C5.99852 13.8023 5.92999 13.9676 5.92999 14.14C5.92999 14.3124 5.99852 14.4777 6.12042 14.5996C6.24232 14.7215 6.40763 14.79 6.58002 14.79Z" fill="black"/>
                                  <path d="M10.66 16.96H6.66003C6.48764 16.96 6.32228 17.0285 6.20038 17.1504C6.07848 17.2723 6.01001 17.4376 6.01001 17.61C6.01001 17.7824 6.07848 17.9477 6.20038 18.0696C6.32228 18.1915 6.48764 18.26 6.66003 18.26H10.66C10.8324 18.26 10.9977 18.1915 11.1196 18.0696C11.2415 17.9477 11.31 17.7824 11.31 17.61C11.31 17.4376 11.2415 17.2723 11.1196 17.1504C10.9977 17.0285 10.8324 16.96 10.66 16.96Z" fill="black"/>
                                  <path d="M13.01 6.83001C13.6838 6.83001 14.23 6.2838 14.23 5.61001C14.23 4.93623 13.6838 4.39001 13.01 4.39001C12.3362 4.39001 11.79 4.93623 11.79 5.61001C11.79 6.2838 12.3362 6.83001 13.01 6.83001Z" fill="black"/>
                                  <path d="M21.7 20.94H20.22V15.94C20.2174 15.5828 20.0743 15.2409 19.8217 14.9883C19.5691 14.7357 19.2272 14.5926 18.87 14.59H14.19V12.72C13.8526 12.983 13.4378 13.1272 13.01 13.13H12.89V20.95H4.46002V10.95H10.46C10.18 10.54 9.87004 10.08 9.54004 9.61002H4.54004C4.182 9.61002 3.83862 9.75223 3.58545 10.0054C3.33228 10.2586 3.19 10.6019 3.19 10.96V20.96H1.67999C1.5076 20.96 1.3423 21.0285 1.2204 21.1504C1.0985 21.2723 1.03003 21.4376 1.03003 21.61C1.03003 21.7824 1.0985 21.9477 1.2204 22.0696C1.3423 22.1915 1.5076 22.26 1.67999 22.26H21.68C21.8524 22.26 22.0177 22.1915 22.1396 22.0696C22.2615 21.9477 22.33 21.7824 22.33 21.61C22.33 21.4376 22.2615 21.2723 22.1396 21.1504C22.0177 21.0285 21.8524 20.96 21.68 20.96L21.7 20.94ZM18.92 20.94H14.19V15.94H18.92V20.94Z" fill="black"/>
                                  <path d="M13 12.3L12.48 11.55C12.48 11.55 10.85 9.23002 9.61997 7.42002C9.27408 6.85918 9.07215 6.22158 9.03202 5.56388C8.9919 4.90618 9.11485 4.24873 9.38999 3.65C9.72541 2.98362 10.2445 2.42714 10.8859 2.04618C11.5273 1.66522 12.2644 1.47571 13.01 1.50003C13.8288 1.48894 14.6313 1.72939 15.3091 2.189C15.9869 2.6486 16.5073 3.30521 16.8 4.07004C16.9953 4.67809 17.0472 5.32303 16.9518 5.9545C16.8564 6.58597 16.6162 7.18679 16.25 7.71C15.25 9.28 13.54 11.54 13.52 11.57L13 12.3ZM13 2.80002C12.493 2.775 11.9897 2.89778 11.5512 3.15342C11.1128 3.40905 10.758 3.78654 10.53 4.24002C10.3587 4.63141 10.2838 5.05815 10.3117 5.48447C10.3395 5.91079 10.4692 6.32425 10.69 6.69004C11.48 7.86004 12.43 9.23003 13.01 10.06C13.59 9.27003 14.51 7.98001 15.18 6.98001C15.4258 6.62762 15.5894 6.22455 15.6586 5.80051C15.7278 5.37647 15.701 4.94228 15.58 4.53C15.3869 4.00998 15.0366 3.56302 14.5779 3.25119C14.1191 2.93937 13.5746 2.77817 13.02 2.79001L13 2.80002Z" fill="black"/>
                                </g>
                                <defs>
                                  <clipPath id="clip0_list_onsite">
                                    <rect width="21.35" height="20.74" fill="white" transform="translate(1 1.5)"/>
                                  </clipPath>
                                </defs>
                              </svg>
                            )}
                          </div>
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatTime(shift.plannedStart)} - {formatTime(shift.plannedEnd)}
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {assignedEngineer?.name || (
                                <span className="text-pink-700 font-semibold">⚠️ Unassigned</span>
                              )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              shift.status === 'ASSIGNED'
                                    ? 'bg-yellow-100 text-yellow-800'
                                : shift.status === 'COMPLETED'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {shift.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <AssignDropdown
                            shiftId={shift.id}
                            currentEngineerId={assignedEngineer?.id}
                            countryCode={shift.countryCode}
                            sectorId={shift.sectorId}
                            plannedStart={shift.plannedStart}
                            plannedEnd={shift.plannedEnd}
                            onAssign={() => mutate()}
                          />
                        </td>
                      </tr>
                    )
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No shifts found for the selected period.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </main>
      </div>
  )
}
