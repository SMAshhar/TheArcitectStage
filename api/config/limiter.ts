import { RateLimiter } from "limiter";

export const adminLimiter = new RateLimiter({
    tokensPerInterval: 3,
    interval: "min",
    fireImmediately: true
})

export const contactLimiter = new RateLimiter({
    tokensPerInterval: 3,
    interval: "min",
    fireImmediately: true
})

export const subscribeLimiter = new RateLimiter({
    tokensPerInterval: 3,
    interval: "min",
    fireImmediately: true
})
export const authLimiter = new RateLimiter({
    tokensPerInterval: 3,
    interval: "min",
    fireImmediately: true
})

