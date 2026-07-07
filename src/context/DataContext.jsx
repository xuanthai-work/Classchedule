import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { toHM } from '../lib/date'

const DataContext = createContext(null)

// Chuẩn hoá giờ '14:30:00' -> '14:30'
const normBooking = (b) => ({ ...b, start_time: toHM(b.start_time), end_time: toHM(b.end_time) })

export function DataProvider({ children }) {
  const [rooms, setRooms] = useState([])
  const [caTypes, setCaTypes] = useState([])
  const [renters, setRenters] = useState([])
  const [renterPrices, setRenterPrices] = useState([])
  const [bookings, setBookings] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setError(null)
    const [r1, rc, r2, rp, r3, r4] = await Promise.all([
      supabase.from('rooms').select('*').order('sort', { ascending: true }),
      supabase.from('ca_types').select('*').order('sort', { ascending: true }),
      supabase.from('renters').select('*').order('name', { ascending: true }),
      supabase.from('renter_prices').select('*'),
      supabase.from('bookings').select('*').order('date').order('start_time'),
      supabase.from('tasks').select('*').order('created_at', { ascending: true }),
    ])
    const firstErr = r1.error || rc.error || r2.error || rp.error || r3.error || r4.error
    if (firstErr) {
      setError(firstErr.message)
      setLoading(false)
      return
    }
    setRooms(r1.data || [])
    setCaTypes(rc.data || [])
    setRenters(r2.data || [])
    setRenterPrices(rp.data || [])
    setBookings((r3.data || []).map(normBooking))
    setTasks(r4.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    // Đồng bộ thời gian thực giữa các thiết bị
    const channel = supabase
      .channel('rt-all')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => refresh())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [refresh])

  const roomsById = useMemo(() => Object.fromEntries(rooms.map((r) => [r.id, r])), [rooms])
  const caTypesById = useMemo(() => Object.fromEntries(caTypes.map((c) => [c.id, c])), [caTypes])
  const rentersById = useMemo(() => Object.fromEntries(renters.map((r) => [r.id, r])), [renters])
  // Bảng giá: key `${renter_id}__${ca_type_id}__${room_id}` -> giá 1 ca
  const priceMap = useMemo(
    () => Object.fromEntries(renterPrices.map((p) => [`${p.renter_id}__${p.ca_type_id}__${p.room_id}`, Number(p.price) || 0])),
    [renterPrices],
  )
  const getPrice = useCallback(
    (renterId, caTypeId, roomId) => priceMap[`${renterId}__${caTypeId}__${roomId}`] || 0,
    [priceMap],
  )

  // ---- CRUD (cập nhật state ngay, realtime sẽ đồng bộ lại) ----
  const api = {
    // Buổi thuê
    async addBooking(data) {
      const { error } = await supabase.from('bookings').insert(data)
      if (error) throw error
      await refresh()
    },
    async addBookingSeries(rows) {
      const { error } = await supabase.from('bookings').insert(rows)
      if (error) throw error
      await refresh()
    },
    async updateBooking(id, data) {
      const { error } = await supabase.from('bookings').update(data).eq('id', id)
      if (error) throw error
      await refresh()
    },
    async deleteBooking(id) {
      const { error } = await supabase.from('bookings').delete().eq('id', id)
      if (error) throw error
      setBookings((b) => b.filter((x) => x.id !== id))
    },
    async deleteSeries(seriesId) {
      const { error } = await supabase.from('bookings').delete().eq('series_id', seriesId)
      if (error) throw error
      setBookings((b) => b.filter((x) => x.series_id !== seriesId))
    },
    async deleteBookings(ids) {
      if (!ids || !ids.length) return
      const { error } = await supabase.from('bookings').delete().in('id', ids)
      if (error) throw error
      setBookings((b) => b.filter((x) => !ids.includes(x.id)))
    },
    async setPaid(id, paid) {
      setBookings((b) => b.map((x) => (x.id === id ? { ...x, paid } : x)))
      const { error } = await supabase.from('bookings').update({ paid }).eq('id', id)
      if (error) throw error
    },
    // Người thuê
    async addRenter(data) {
      const { data: row, error } = await supabase.from('renters').insert(data).select().single()
      if (error) throw error
      await refresh()
      return row
    },
    async updateRenter(id, data) {
      const { error } = await supabase.from('renters').update(data).eq('id', id)
      if (error) throw error
      await refresh()
    },
    async deleteRenter(id) {
      const { error } = await supabase.from('renters').delete().eq('id', id)
      if (error) throw error
      await refresh()
    },
    // Phòng
    async addRoom(data) {
      const { error } = await supabase.from('rooms').insert(data)
      if (error) throw error
      await refresh()
    },
    async updateRoom(id, data) {
      const { error } = await supabase.from('rooms').update(data).eq('id', id)
      if (error) throw error
      await refresh()
    },
    async deleteRoom(id) {
      const { error } = await supabase.from('rooms').delete().eq('id', id)
      if (error) throw error
      await refresh()
    },
    // Loại ca
    async addCaType(data) {
      const { error } = await supabase.from('ca_types').insert(data)
      if (error) throw error
      await refresh()
    },
    async updateCaType(id, data) {
      const { error } = await supabase.from('ca_types').update(data).eq('id', id)
      if (error) throw error
      await refresh()
    },
    async deleteCaType(id) {
      const { error } = await supabase.from('ca_types').delete().eq('id', id)
      if (error) throw error
      await refresh()
    },
    // Bảng giá theo giáo viên × loại ca
    // Thay toàn bộ mức giá của 1 giáo viên bằng danh sách mới (thêm/bớt/sửa linh hoạt)
    async replaceRenterPrices(renterId, rows) {
      const clean = rows.filter((r) => r.renter_id && r.ca_type_id && r.room_id)
      const { error: delErr } = await supabase.from('renter_prices').delete().eq('renter_id', renterId)
      if (delErr) throw delErr
      if (clean.length) {
        const { error } = await supabase.from('renter_prices').insert(clean)
        if (error) throw error
      }
      await refresh()
    },
    // Việc cần làm
    async addTask(content) {
      const { error } = await supabase.from('tasks').insert({ content, done: false })
      if (error) throw error
      await refresh()
    },
    async toggleTask(id, done) {
      setTasks((t) => t.map((x) => (x.id === id ? { ...x, done } : x)))
      const { error } = await supabase.from('tasks').update({ done }).eq('id', id)
      if (error) throw error
    },
    async deleteTask(id) {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      setTasks((t) => t.filter((x) => x.id !== id))
    },
  }

  const value = {
    rooms, caTypes, renters, renterPrices, bookings, tasks,
    roomsById, caTypesById, rentersById, priceMap, getPrice,
    loading, error, refresh,
    ...api,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
