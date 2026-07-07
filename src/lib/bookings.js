import { timeToMinutes } from './date'

// Tiền của 1 buổi = giá(giáo viên, loại ca, phòng) × số ca
// priceMap: { `${renter_id}__${ca_type_id}__${room_id}`: giá 1 ca }
export function computeAmount(booking, priceMap) {
  const price = Number(priceMap[`${booking.renter_id}__${booking.ca_type_id}__${booking.room_id}`]) || 0
  return price * (booking.ca_count || 1)
}

// Tổng thời lượng buổi (phút) = thời lượng loại ca × số ca
export function bookingDurationMin(booking, caTypesById) {
  const ct = caTypesById[booking.ca_type_id]
  if (!ct) return 0
  return Number(ct.duration_min || 0) * (booking.ca_count || 1)
}

// Trả về Set id các buổi bị trùng (cùng phòng, cùng ngày, giờ chồng nhau)
export function findConflicts(bookings) {
  const conflicts = new Set()
  const byKey = {}
  for (const b of bookings) {
    const key = `${b.date}__${b.room_id}`
    ;(byKey[key] ||= []).push(b)
  }
  for (const list of Object.values(byKey)) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        const overlap =
          timeToMinutes(a.start_time) < timeToMinutes(b.end_time) &&
          timeToMinutes(b.start_time) < timeToMinutes(a.end_time)
        if (overlap) {
          conflicts.add(a.id)
          conflicts.add(b.id)
        }
      }
    }
  }
  return conflicts
}

// Xếp làn cho các buổi chồng giờ trong 1 cột ngày (để hiển thị cạnh nhau)
// events: [{..., s: phút bắt đầu, e: phút kết thúc}] -> gán ev.lane, ev.lanes
export function packLanes(events) {
  const sorted = [...events].sort((a, b) => a.s - b.s || a.e - b.e)
  let cluster = []
  let clusterEnd = -Infinity

  const flush = () => {
    const laneEnds = [] // thời điểm kết thúc gần nhất của mỗi làn
    for (const ev of cluster) {
      let placed = false
      for (let i = 0; i < laneEnds.length; i++) {
        if (laneEnds[i] <= ev.s) {
          ev.lane = i
          laneEnds[i] = ev.e
          placed = true
          break
        }
      }
      if (!placed) {
        ev.lane = laneEnds.length
        laneEnds.push(ev.e)
      }
    }
    const total = laneEnds.length
    for (const ev of cluster) ev.lanes = total
    cluster = []
  }

  for (const ev of sorted) {
    if (cluster.length && ev.s >= clusterEnd) {
      flush()
      clusterEnd = -Infinity
    }
    cluster.push(ev)
    clusterEnd = Math.max(clusterEnd, ev.e)
  }
  flush()
  return sorted
}
