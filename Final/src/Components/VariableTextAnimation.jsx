import React from 'react'

export default function VariableTextAnimation({
    children,
    className = '',
    baseSettings = { wght: 300, slnt: 100, CNTR: 100 },
    hoverSettings = { wght: 700, slnt: 0, CNTR: 0 },
    animDuration = 1.5,
}) {
    let globalCharIndex = 0

    const processChildren = (node) => {
        if (!node) return null

        if (typeof node === 'string') {
            return node.split('').map((char) => {
                const currentGlobalIndex = globalCharIndex++
                return (
                    <span
                        key={currentGlobalIndex}
                        className="variable-text-char"
                        style={{
                            '--char-index': currentGlobalIndex,
                            display: 'inline-block',
                            whiteSpace: 'pre'
                        }}
                    >
                        {char}
                    </span>
                )
            })
        }

        if (React.isValidElement(node)) {
            if (node.type === 'br') return <br key={globalCharIndex++} />

            return React.cloneElement(node, { key: globalCharIndex++ },
                React.Children.map(node.props.children, (child) =>
                    processChildren(child)
                )
            )
        }
        return node
    }

    return (
        <div
            className={className}
            style={{
                '--wght-min': baseSettings.wght,
                '--wght-max': hoverSettings.wght,
                '--slnt-min': baseSettings.slnt,
                '--slnt-max': hoverSettings.slnt,
                '--cntr-min': baseSettings.CNTR,
                '--cntr-max': hoverSettings.CNTR,
                '--anim-duration': `${animDuration}s`
            }}
        >
            {React.Children.map(children, (child) => processChildren(child))}
        </div>
    )
}
