"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faStar as faStarSolid, faStarHalfStroke } from "@fortawesome/free-solid-svg-icons"
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons"

type Props = {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: "sm" | "md"
}

function starIconForValue(starIndex: number, value: number) {
  if (value >= starIndex) return faStarSolid
  if (value >= starIndex - 0.5) return faStarHalfStroke
  return faStarRegular
}

function starClassForValue(starIndex: number, value: number) {
  if (value >= starIndex - 0.5) return "text-yellow-400"
  return "text-gray-600"
}

export default function HalfStarRating({ value, onChange, readonly = false, size = "md" }: Props) {
  const iconSize = size === "sm" ? "text-sm" : "text-xl"

  function handleClick(star: number, isLeftHalf: boolean) {
    if (readonly || !onChange) return
    onChange(isLeftHalf ? star - 0.5 : star)
  }

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={`Note : ${value || "non renseignée"} sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star} className="relative w-8 h-8">
          <FontAwesomeIcon
            icon={starIconForValue(star, value)}
            className={`absolute inset-0 m-auto ${iconSize} ${starClassForValue(star, value)} pointer-events-none`}
          />
          {!readonly && onChange && (
            <>
              <button
                type="button"
                aria-label={`${star - 0.5} étoiles`}
                className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10"
                onClick={() => handleClick(star, true)}
              />
              <button
                type="button"
                aria-label={`${star} étoiles`}
                className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10"
                onClick={() => handleClick(star, false)}
              />
            </>
          )}
        </div>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-gray-400 tabular-nums">{value.toFixed(1)}/5</span>
      )}
    </div>
  )
}
