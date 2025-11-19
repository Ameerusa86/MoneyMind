import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "8px",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 6C2 4.89543 2.89543 4 4 4H20C21.1046 4 22 4.89543 22 6V8C22 9.10457 21.1046 10 20 10H4C2.89543 10 2 9.10457 2 8V6Z"
            fill="white"
            opacity="0.9"
          />
          <path
            d="M2 12C2 10.8954 2.89543 10 4 10H16C17.1046 10 18 10.8954 18 12V14C18 15.1046 17.1046 16 16 16H4C2.89543 16 2 15.1046 2 14V12Z"
            fill="white"
            opacity="0.7"
          />
          <path
            d="M2 18C2 16.8954 2.89543 16 4 16H12C13.1046 16 14 16.8954 14 18V20C14 21.1046 13.1046 22 12 22H4C2.89543 22 2 21.1046 2 20V18Z"
            fill="white"
            opacity="0.5"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
