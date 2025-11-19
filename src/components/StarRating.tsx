import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  value: number; // 0-5 score
  onChange: (value: number) => void;
  label?: string;
}

const StarRating = ({ value, onChange, label }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const displayStars = hoverValue !== null ? hoverValue : Math.round(value);

  const handleClick = (starIndex: number) => {
    // Stars are 1-5, which equals score 1-5
    onChange(starIndex);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starIndex) => (
          <button
            key={starIndex}
            type="button"
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => setHoverValue(starIndex)}
            onMouseLeave={() => setHoverValue(null)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                starIndex <= displayStars
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-3 text-lg font-semibold text-primary">
          {value.toFixed(1)}/5
        </span>
      </div>
    </div>
  );
};

export default StarRating;
