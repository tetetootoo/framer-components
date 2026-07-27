/// <reference types="react" />
import React, { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

interface Props {
    images: any[]
    scrollLength: number
    smoothing: number
    scaleActive: number
    scaleInactive: number
    blurAmount: number
    travelDistance: number
    crossfadeWidth: number
    enableHaptics: boolean
    hapticStrength: number
    backgroundColor: string
    showProgress: boolean
    dotColor: string
    dotActiveColor: string
}

function resolveImageSrc(value: any): string {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object" && value.src) return value.src
    return ""
}

export default function VerticalCarouselHeavyScroll({
    images = [],
    scrollLength = 120,
    smoothing = 0.08,
    scaleActive = 1,
    scaleInactive = 0.8,
    blurAmount = 16,
    travelDistance = 55,
    crossfadeWidth = 0.55,
    enableHaptics = true,
    hapticStrength = 10,
    backgroundColor = "#0b0b0b",
    showProgress = true,
    dotColor = "rgba(255,255,255,0.3)",
    dotActiveColor = "#ffffff",
}: Props) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const rawProgress = useRef(0)
    const smoothProgress = useRef(0)
    const rafId = useRef<number | undefined>(undefined)
    const lastHapticIndex = useRef(-1)
    const [renderProgress, setRenderProgress] = useState(0)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const items = images.filter((item) => resolveImageSrc(item))
    const count = Math.max(items.length, 1)

    useEffect(() => {
        if (isCanvas) return

        const computeRaw = () => {
            const el = wrapperRef.current
            if (!el) return 0
            const rect = el.getBoundingClientRect()
            const total = rect.height - window.innerHeight
            if (total <= 0) return 0
            return Math.min(1, Math.max(0, -rect.top / total))
        }

        const loop = () => {
            rawProgress.current = computeRaw()
            const diff = rawProgress.current - smoothProgress.current
            const factor = Math.max(0.001, Math.min(1, smoothing))
            smoothProgress.current += diff * factor
            if (Math.abs(diff) < 0.0005) smoothProgress.current = rawProgress.current

            setRenderProgress(smoothProgress.current)

            const activeIndex = Math.round(smoothProgress.current * (count - 1))
            if (enableHaptics && activeIndex !== lastHapticIndex.current) {
                lastHapticIndex.current = activeIndex
                if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                    try {
                        navigator.vibrate(hapticStrength)
                    } catch {}
                }
            }

            rafId.current = requestAnimationFrame(loop)
        }

        rafId.current = requestAnimationFrame(loop)
        return () => {
            if (rafId.current !== undefined) cancelAnimationFrame(rafId.current)
        }
    }, [isCanvas, smoothing, count, enableHaptics, hapticStrength])

    const progressIndex = renderProgress * (count - 1)
    const activeDotIndex = Math.round(progressIndex)
    const scrollTrackHeight = `${count * scrollLength}vh`

    return (
        <div
            ref={wrapperRef}
            style={{
                position: "relative",
                width: "100%",
                height: isCanvas ? "100%" : scrollTrackHeight,
            }}
        >
            {/* Ancestor Stacks/Frames must allow overflow — clipping breaks position: sticky */}
            <div
                style={{
                    position: isCanvas ? "relative" : "sticky",
                    top: 0,
                    width: "100%",
                    height: isCanvas ? "100%" : "100vh",
                    overflow: "hidden",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {items.map((item, i) => {
                    const t = isCanvas ? (i === 0 ? 0 : 1) : progressIndex - i
                    const clampedT = Math.max(-1, Math.min(1, t / Math.max(crossfadeWidth, 0.0001)))
                    const absT = Math.abs(clampedT)
                    const scale = scaleActive - (scaleActive - scaleInactive) * absT
                    const blur = blurAmount * absT
                    const translateY = clampedT * travelDistance
                    const opacity = Math.max(0, 1 - absT)
                    const src = resolveImageSrc(item)

                    return (
                        <img
                            key={i}
                            src={src}
                            alt=""
                            style={{
                                position: "absolute",
                                height: "70%",
                                width: "auto",
                                maxWidth: "80%",
                                objectFit: "contain",
                                transform: `translateY(${translateY}%) scale(${scale})`,
                                filter: `blur(${blur}px)`,
                                opacity,
                                willChange: "transform, filter, opacity",
                                pointerEvents: "none",
                            }}
                        />
                    )
                })}

                {showProgress && items.length > 1 && (
                    <div
                        style={{
                            position: "absolute",
                            right: 24,
                            top: "50%",
                            transform: "translateY(-50%)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            zIndex: 5,
                        }}
                    >
                        {items.map((_, i) => {
                            const active = isCanvas ? i === 0 : activeDotIndex === i
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: 6,
                                        height: active ? 20 : 6,
                                        borderRadius: 3,
                                        backgroundColor: active ? dotActiveColor : dotColor,
                                        transition: "height 0.3s ease, background-color 0.3s ease",
                                    }}
                                />
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(VerticalCarouselHeavyScroll, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        defaultValue: [],
    },
    scrollLength: {
        type: ControlType.Number,
        title: "Scroll Length",
        defaultValue: 120,
        min: 40,
        max: 300,
        step: 10,
        displayStepper: true,
        description: "Scroll distance (vh) per image",
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 0.08,
        min: 0.02,
        max: 1,
        step: 0.01,
        description: "Lower = heavier/laggier follow, higher = snappier",
    },
    scaleActive: {
        type: ControlType.Number,
        title: "Active Scale",
        defaultValue: 1,
        min: 0.5,
        max: 1.5,
        step: 0.01,
    },
    scaleInactive: {
        type: ControlType.Number,
        title: "Inactive Scale",
        defaultValue: 0.8,
        min: 0.3,
        max: 1.5,
        step: 0.01,
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Max Blur",
        defaultValue: 16,
        min: 0,
        max: 60,
        step: 1,
    },
    travelDistance: {
        type: ControlType.Number,
        title: "Travel Distance",
        defaultValue: 55,
        min: 0,
        max: 150,
        step: 1,
        description: "% images move vertically as they enter/exit",
    },
    crossfadeWidth: {
        type: ControlType.Number,
        title: "Crossfade Width",
        defaultValue: 0.55,
        min: 0.1,
        max: 1,
        step: 0.05,
    },
    enableHaptics: {
        type: ControlType.Boolean,
        title: "Haptics",
        defaultValue: true,
    },
    hapticStrength: {
        type: ControlType.Number,
        title: "Haptic Strength",
        defaultValue: 10,
        min: 1,
        max: 100,
        step: 1,
        hidden: (props) => !props.enableHaptics,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0b0b0b",
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress Dots",
        defaultValue: true,
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "rgba(255,255,255,0.3)",
        hidden: (props) => !props.showProgress,
    },
    dotActiveColor: {
        type: ControlType.Color,
        title: "Dot Active Color",
        defaultValue: "#ffffff",
        hidden: (props) => !props.showProgress,
    },
})
