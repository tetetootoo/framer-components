import { addPropertyControls, ControlType } from "framer"
import { useState, useRef, useEffect } from "react"

function vimeoEmbedUrl(url: string): string {
    const match = url?.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/)?(\d+)/)
    if (!match) return ""
    return `https://player.vimeo.com/video/${match[1]}?autoplay=1`
}

function resolveImageSrc(value: any): string {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object" && value.src) return value.src
    return ""
}

interface Props {
    heroVideoUrl: string
    topVideo1Url: string
    topVideo1Thumbnail: string
    topVideo2Url: string
    topVideo2Thumbnail: string
    topVideo3Url: string
    topVideo3Thumbnail: string
    topVideo4Url: string
    topVideo4Thumbnail: string
    topVideo5Url: string
    topVideo5Thumbnail: string
    topVideo6Url: string
    topVideo6Thumbnail: string
    buttonLabel: string
    buttonBg: string
    buttonTextColor: string
    buttonBorderColor: string
    buttonBorderRadius: number
    buttonFontSize: number
    buttonFont: any
}

export default function HeroVideoComponent({
    heroVideoUrl = "",
    topVideo1Url = "",
    topVideo1Thumbnail = "",
    topVideo2Url = "",
    topVideo2Thumbnail = "",
    topVideo3Url = "",
    topVideo3Thumbnail = "",
    topVideo4Url = "",
    topVideo4Thumbnail = "",
    topVideo5Url = "",
    topVideo5Thumbnail = "",
    topVideo6Url = "",
    topVideo6Thumbnail = "",
    buttonLabel = "Play",
    buttonBg = "rgba(255,255,255,0.15)",
    buttonTextColor = "#ffffff",
    buttonBorderColor = "rgba(255,255,255,0.5)",
    buttonBorderRadius = 8,
    buttonFontSize = 16,
    buttonFont = {},
}: Props) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const heroRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const v = heroRef.current
        if (!v) return
        v.muted = true
        v.play().catch(() => {})
    }, [heroVideoUrl])

    const topVideos = [
        { videoUrl: topVideo1Url, thumbnailUrl: topVideo1Thumbnail },
        { videoUrl: topVideo2Url, thumbnailUrl: topVideo2Thumbnail },
        { videoUrl: topVideo3Url, thumbnailUrl: topVideo3Thumbnail },
        { videoUrl: topVideo4Url, thumbnailUrl: topVideo4Thumbnail },
        { videoUrl: topVideo5Url, thumbnailUrl: topVideo5Thumbnail },
        { videoUrl: topVideo6Url, thumbnailUrl: topVideo6Thumbnail },
    ].filter((v) => v.videoUrl?.trim())

    const hasTopVideos = topVideos.length > 0
    const hasMultiple = topVideos.length > 1
    const activeVideoUrl = topVideos[activeIndex]?.videoUrl

    const startVideo = (index: number) => {
        setActiveIndex(index)
        setIsPlaying(true)
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100vh",
                overflow: "hidden",
                backgroundColor: "#000",
            }}
        >
            {/* Hero background video */}
            <video
                ref={heroRef}
                src={heroVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: 1,
                    filter: isPlaying ? "blur(10px)" : "none",
                    transform: isPlaying ? "scale(1.15)" : "scale(1)",
                    transition: "filter 0.4s ease, transform 0.4s ease",
                }}
            />

            {/* Play button */}
            {hasTopVideos && !isPlaying && (
                <button
                    onClick={() => startVideo(activeIndex)}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 5,
                        width: "fit-content",
                        background: buttonBg,
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        border: `1.5px solid ${buttonBorderColor}`,
                        borderRadius: buttonBorderRadius,
                        height: 40,
                        padding: "0 15px",
                        color: buttonTextColor,
                        ...buttonFont,
                        fontSize: buttonFontSize,
                        cursor: "pointer",
                        textAlign: "center",
                    }}
                >
                    {buttonLabel}
                </button>
            )}

            {/* Click-outside overlay — closes top video */}
            {isPlaying && (
                <div
                    onClick={() => setIsPlaying(false)}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 9,
                        cursor: "pointer",
                    }}
                />
            )}

            {/* Vimeo top video — centered, 70% of viewport */}
            {isPlaying && activeVideoUrl && (
                <iframe
                    key={activeVideoUrl}
                    src={vimeoEmbedUrl(activeVideoUrl)}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "70%",
                        height: "70%",
                        border: "none",
                        zIndex: 10,
                    }}
                />
            )}

            {/* Thumbnails — bottom of hero, always visible when multiple top videos */}
            {hasMultiple && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 40,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        gap: 10,
                        zIndex: 20,
                    }}
                >
                    {topVideos.map((video, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); startVideo(index) }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                padding: 0,
                                border:
                                    activeIndex === index && isPlaying
                                        ? "2.5px solid #fff"
                                        : "2.5px solid rgba(255,255,255,0.4)",
                                cursor: "pointer",
                                overflow: "hidden",
                                background: "#555",
                                flexShrink: 0,
                                boxSizing: "border-box",
                                transform: hoveredIndex === index ? "scale(1.1)" : "scale(1)",
                                transition: "border-color 0.2s, transform 0.2s",
                            }}
                        >
                            {resolveImageSrc(video.thumbnailUrl) ? (
                                <img
                                    src={resolveImageSrc(video.thumbnailUrl)}
                                    alt=""
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            ) : null}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

addPropertyControls(HeroVideoComponent, {
    heroVideoUrl: {
        type: ControlType.File,
        title: "Hero Video",
        allowedFileTypes: ["mp4", "mov", "webm", "ogg"],
    },
    topVideo1Url: {
        type: ControlType.String,
        title: "Top Video 1 URL",
        placeholder: "https://vimeo.com/123456789",
        defaultValue: "",
    },
    topVideo1Thumbnail: {
        type: ControlType.Image,
        title: "Top Video 1 Thumb",
    },
    topVideo2Url: {
        type: ControlType.String,
        title: "Top Video 2 URL",
        placeholder: "https://vimeo.com/123456789",
        defaultValue: "",
    },
    topVideo2Thumbnail: {
        type: ControlType.Image,
        title: "Top Video 2 Thumb",
    },
    topVideo3Url: {
        type: ControlType.String,
        title: "Top Video 3 URL",
        placeholder: "https://vimeo.com/123456789",
        defaultValue: "",
    },
    topVideo3Thumbnail: {
        type: ControlType.Image,
        title: "Top Video 3 Thumb",
    },
    topVideo4Url: {
        type: ControlType.String,
        title: "Top Video 4 URL",
        placeholder: "https://vimeo.com/123456789",
        defaultValue: "",
    },
    topVideo4Thumbnail: {
        type: ControlType.Image,
        title: "Top Video 4 Thumb",
    },
    topVideo5Url: {
        type: ControlType.String,
        title: "Top Video 5 URL",
        placeholder: "https://vimeo.com/123456789",
        defaultValue: "",
    },
    topVideo5Thumbnail: {
        type: ControlType.Image,
        title: "Top Video 5 Thumb",
    },
    topVideo6Url: {
        type: ControlType.String,
        title: "Top Video 6 URL",
        placeholder: "https://vimeo.com/123456789",
        defaultValue: "",
    },
    topVideo6Thumbnail: {
        type: ControlType.Image,
        title: "Top Video 6 Thumb",
    },
    buttonLabel: {
        type: ControlType.String,
        title: "Button Label",
        defaultValue: "Play",
    },
    buttonBg: {
        type: ControlType.Color,
        title: "Button Fill",
        defaultValue: "rgba(255,255,255,0.15)",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#ffffff",
    },
    buttonBorderColor: {
        type: ControlType.Color,
        title: "Button Border",
        defaultValue: "rgba(255,255,255,0.5)",
    },
    buttonBorderRadius: {
        type: ControlType.Number,
        title: "Button Radius",
        defaultValue: 8,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    buttonFontSize: {
        type: ControlType.Number,
        title: "Button Font Size",
        defaultValue: 16,
        min: 8,
        max: 72,
        step: 1,
        displayStepper: true,
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "basic",
    },
})
