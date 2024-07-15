import { Address, BigInt } from "@graphprotocol/graph-ts"
import { dataSource } from "@graphprotocol/graph-ts"

export const SECONDS_IN_HOUR = BigInt.fromI32(60 * 60)
export const SECONDS_IN_DAY = SECONDS_IN_HOUR.times(BigInt.fromI32(24))
export const SUMMARY_ID = "SUMMARY"
export const PCT_BASE = BigInt.fromI32(10).pow(18)

export const AUCTION_ORDER_NA = "NA"
export const AUCTION_ORDER_PLACED = "PLACED"
export const AUCTION_ORDER_CLAIMED = "CLAIMED"
export const AUCTION_ORDER_CANCELLED = "CANCELLED"

export const ORDER_TYPE_SELL = "SELL"
export const ORDER_TYPE_BUY = "BUY"
export const ORDER_TYPE_AUCTION = "AUCTION"
