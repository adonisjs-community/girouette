const CONTROLLER_META = new WeakMap()

export const setControllerMeta = (target: any, key: string, value: any) => {
  if (!CONTROLLER_META.has(target)) {
    CONTROLLER_META.set(target, {})
  }

  CONTROLLER_META.get(target)[key] = value
}

export const pushControllerMeta = (target: any, key: string, value: any) => {
  if (!CONTROLLER_META.has(target)) {
    CONTROLLER_META.set(target, {})
  }

  const existing = CONTROLLER_META.get(target)[key] || []
  CONTROLLER_META.get(target)[key] = [...existing, value]
}

export const getControllerMeta = (target: any, key: string) => {
  return CONTROLLER_META.get(target)?.[key]
}

export const getAllControllerMeta = (target: any) => {
  return CONTROLLER_META.get(target) || {}
}
