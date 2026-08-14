export const money = n => '₹' + Number(n ?? 0).toLocaleString('en-IN')

// Form uploads live in Drive; this is the only URL shape that renders as an <img>.
export const photoUrl = id => (id ? `https://lh3.googleusercontent.com/d/${id}=w400` : null)

export const initials = name =>
  name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()

export const playerTraits = p =>
  [p.age && `${p.age} yrs`, p.all_rounder && 'all rounder', p.batting, p.bowling]
    .filter(Boolean)
    .join(' · ')
