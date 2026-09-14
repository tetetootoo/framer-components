/// <reference types="react" />
import React, { useEffect, useMemo, useRef } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

interface Props {
    images: any[]
    elementCount: number
    minSize: number
    maxSize: number
    minDuration: number
    maxDuration: number
    verticalRangeStart: number
    verticalRangeEnd: number
    wobbleAmplitude: number
    wobbleSpeed: number
    rotationAmount: number
    direction: "leftToRight" | "rightToLeft"
    fadeEdge: number
    backgroundColor: string
}

interface Wanderer {
    src: string
    laneY: number // 0-1 fraction of container height
    phase: number
    duration: number // seconds to cross the container once
    startOffset: number // 0-1 fraction — staggers each element's starting position
    size: number // px, image height
    rotationPhase: number
}

function resolveImageSrc(value: any): string {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object" && value.src) return value.src
    return ""
}

export default function WanderingElements({
    images = [],
    elementCount = 14,
    minSize = 60,
    maxSize = 140,
    minDuration = 18,
    maxDuration = 40,
    verticalRangeStart = 5,
    verticalRangeEnd = 95,
    wobbleAmplitude = 20,
    wobbleSpeed = 0.5,
    rotationAmount = 6,
    direction = "leftToRight",
    fadeEdge = 10,
    backgroundColor = "transparent",
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLImageElement | null)[]>([])
    const startTime = useRef<number | null>(null)
    const rafId = useRef<number | undefined>(undefined)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const validSrcs = images.map(resolveImageSrc).filter(Boolean)
    const srcsKey = validSrcs.join("|")

    // Each wanderer gets its own randomized lane, speed, size, and phase so
    // the group never reads as a single synchronized row — closer to the
    // scattered, independent drift of strom.cafe's floating letters.
    const wanderers = useMemo<Wanderer[]>(() => {
        if (validSrcs.length === 0) return []
        const count = Math.max(1, Math.round(elementCount))
        const list: Wanderer[] = []
        for (let i = 0; i < count; i++) {
            list.push({
                src: validSrcs[i % validSrcs.length],
                laneY:
                    (verticalRangeStart +
                        Math.random() * Math.max(0, verticalRangeEnd - verticalRangeStart)) /
                    100,
                phase: Math.random() * Math.PI * 2,
                duration: minDuration + Math.random() * Math.max(0, maxDuration - minDuration),
                startOffset: Math.random(),
                size: minSize + Math.random() * Math.max(0, maxSize - minSize),
                rotationPhase: Math.random() * Math.PI * 2,
            })
        }
        return list
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        srcsKey,
        elementCount,
        minSize,
        maxSize,
        minDuration,
        maxDuration,
        verticalRangeStart,
        verticalRangeEnd,
    ])

    useEffect(() => {
        if (isCanvas || wanderers.length === 0) return

        const dir = direction === "rightToLeft" ? -1 : 1

        const loop = (t: number) => {
            if (startTime.current === null) startTime.current = t
            const elapsed = (t - startTime.current) / 1000

            const container = containerRef.current
            const width = container?.clientWidth ?? 0
            const height = container?.clientHeight ?? 0

            wanderers.forEach((w, i) => {
                const el = itemRefs.current[i]
                if (!el) return

                const travel = width + w.size * 2
                const progress = (elapsed / w.duration + w.startOffset) % 1
                const x =
                    dir === 1
                        ? progress * travel - w.size
                        : width - progress * travel + w.size

                const wobble = Math.sin(elapsed * wobbleSpeed + w.phase) * wobbleAmplitude
                const y = w.laneY * height + wobble
                const rotation =
                    Math.sin(elapsed * wobbleSpeed * 0.6 + w.rotationPhase) * rotationAmount

                let opacity = 1
                if (fadeEdge > 0) {
                    const distFromStart = progress * travel
                    const distFromEnd = travel - distFromStart
                    opacity = Math.min(1, distFromStart / fadeEdge, distFromEnd / fadeEdge)
                }

                el.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`
                el.style.opacity = String(Math.max(0, opacity))
            })

            rafId.current = requestAnimationFrame(loop)
        }

        rafId.current = requestAnimationFrame(loop)
        return () => {
            if (rafId.current !== undefined) cancelAnimationFrame(rafId.current)
            startTime.current = null
        }
    }, [isCanvas, wanderers, direction, wobbleAmplitude, wobbleSpeed, rotationAmount, fadeEdge])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
                backgroundColor,
            }}
        >
            {wanderers.length === 0 && isCanvas && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#888",
                        fontSize: 13,
                        textAlign: "center",
                        padding: 16,
                    }}
                >
                    Add images →
                </div>
            )}

            {wanderers.map((w, i) => (
                <img
                    key={i}
                    ref={(el) => (itemRefs.current[i] = el)}
                    src={w.src}
                    alt=""
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: w.size,
                        width: "auto",
                        objectFit: "contain",
                        willChange: "transform, opacity",
                        pointerEvents: "none",
                        transform: isCanvas
                            ? `translate(${(i / wanderers.length) * 80}%, ${w.laneY * 100}%)`
                            : undefined,
                    }}
                />
            ))}
        </div>
    )
}

addPropertyControls(WanderingElements, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        defaultValue: [],
    },
    elementCount: {
        type: ControlType.Number,
        title: "Element Count",
        defaultValue: 14,
        min: 1,
        max: 80,
        step: 1,
        displayStepper: true,
        description: "Images repeat to fill this many wandering elements",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["leftToRight", "rightToLeft"],
        optionTitles: ["Left to Right", "Right to Left"],
        defaultValue: "leftToRight",
    },
    minDuration: {
        type: ControlType.Number,
        title: "Min Duration",
        defaultValue: 18,
        min: 2,
        max: 120,
        step: 1,
        description: "Seconds for the slowest crossing",
    },
    maxDuration: {
        type: ControlType.Number,
        title: "Max Duration",
        defaultValue: 40,
        min: 2,
        max: 180,
        step: 1,
        description: "Seconds for the fastest crossing",
    },
    minSize: {
        type: ControlType.Number,
        title: "Min Size",
        defaultValue: 60,
        min: 8,
        max: 800,
        step: 1,
    },
    maxSize: {
        type: ControlType.Number,
        title: "Max Size",
        defaultValue: 140,
        min: 8,
        max: 800,
        step: 1,
    },
    verticalRangeStart: {
        type: ControlType.Number,
        title: "Vertical Start %",
        defaultValue: 5,
        min: 0,
        max: 100,
        step: 1,
    },
    verticalRangeEnd: {
        type: ControlType.Number,
        title: "Vertical End %",
        defaultValue: 95,
        min: 0,
        max: 100,
        step: 1,
    },
    wobbleAmplitude: {
        type: ControlType.Number,
        title: "Wobble Amount",
        defaultValue: 20,
        min: 0,
        max: 150,
        step: 1,
        description: "Vertical bobbing, in pixels",
    },
    wobbleSpeed: {
        type: ControlType.Number,
        title: "Wobble Speed",
        defaultValue: 0.5,
        min: 0,
        max: 3,
        step: 0.05,
    },
    rotationAmount: {
        type: ControlType.Number,
        title: "Rotation Amount",
        defaultValue: 6,
        min: 0,
        max: 45,
        step: 1,
        description: "Max degrees of subtle tilt while drifting",
    },
    fadeEdge: {
        type: ControlType.Number,
        title: "Edge Fade",
        defaultValue: 10,
        min: 0,
        max: 400,
        step: 1,
        description: "Fade in/out width near the entry and exit edges, in pixels",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },
})
