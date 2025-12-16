export const SOUND_FILES = {
    background: '/sound/background.aac',
    carswitch: '/sound/carswitch.aac',
    greenled: '/sound/greenled.aac',
    click: '/sound/click.aac',
    hover: '/sound/hover.aac',
    hoverout: '/sound/hoverout.aac',
}

// Default mixing values (0..1). You can later expose these in a UI and persist to localStorage.
export const DEFAULT_VOLUMES = {
    master: 0.85,
    music: 0.8,
    ui: 0.6,
    car: 0.2,
}

export const SOUND_BUS = {
    background: 'music',
    carswitch: 'car',
    greenled: 'car',
    click: 'ui',
    hover: 'ui',
    hoverout: 'ui',
}


