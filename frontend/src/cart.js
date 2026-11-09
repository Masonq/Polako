import { createContext, useContext } from 'react'
export const KEY = 'polako_cart_v1'
export const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
export const CartCtx = createContext(null)
export const useCart = () => useContext(CartCtx)
export const itemKey = (i) => [i.slug, i.garment, i.color, i.size, i.tech].join('|')
export const unitPrice = (settings, garment, tech) => settings ? settings.garments[garment].price + (tech === 'vez' ? settings.embroidery_extra : 0) : 0

export const FAV_KEY = 'polako_fav_v1'
export const loadFav = () => { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || [] } catch { return [] } }
export const FavCtx = createContext(null)
export const useFav = () => useContext(FavCtx)
