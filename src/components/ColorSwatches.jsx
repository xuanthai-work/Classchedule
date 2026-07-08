import { RENTER_COLORS } from '../lib/constants'

// Bảng chọn màu dùng chung
export default function ColorSwatches({ value, onChange, count = RENTER_COLORS.length, sm = false }) {
  return (
    <div className={'color-swatches' + (sm ? ' sm' : '')}>
      {RENTER_COLORS.slice(0, count).map((c) => (
        <button
          key={c}
          type="button"
          className={'swatch' + (value === c ? ' active' : '')}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={c}
        />
      ))}
    </div>
  )
}
