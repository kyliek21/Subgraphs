import { Address, BigInt, log, store } from "@graphprotocol/graph-ts"
import {
  MasterCopyUpdated,
  TokenLockCreated,
  TokensDeposited,
  TokensWithdrawn,
  FunctionCallAuth,
  TokenDestinationAllowed,
  MoxiePassTokenUpdated,
  SubjectTokenDestinationAllowed,
  TokenManagerUpdated,
} from "../../generated/MoxieTokenLockManager/MoxieTokenLockManager"

import { MoxieTokenLockWallet } from "../../generated/templates"

import {
  TokenLockManager,
  TokenLockWallet,
  AuthorizedFunction,
} from "../../generated/schema"
import { increaseSummaryBalance } from "./utils"

export function handleMasterCopyUpdated(event: MasterCopyUpdated): void {
  // Creates the manager
  let manager = TokenLockManager.load(event.address.toHexString())
  if (manager == null) {
    manager = new TokenLockManager(event.address.toHexString())
    manager.tokens = BigInt.fromI32(0)
    manager.tokenLockCount = BigInt.fromI32(0)
  }
  manager.masterCopy = event.params.masterCopy
  manager.save()
}

/**
 * @param _contractAddress The address of the contract
 * @param _initHash The hash of the initializer
 * @param _beneficiary Address of the beneficiary of locked tokens
 * @param _token The token being used
 * @param _managedAmount Amount of tokens to be managed by the lock contract
 * @param _startTime Start time of the release schedule
 * @param _endTime End time of the release schedule
 * @param _periods Number of periods between start time and end time
 * @param _releaseStartTime Override time for when the releases start
 * @param _revocable Whether the contract is revocable
 * @param _vestingCliffTime Time the cliff vests, 0 if no cliff
 */
export function handleTokenLockCreated(event: TokenLockCreated): void {
  // Get manager
  let manager = TokenLockManager.load(event.address.toHexString())!
  manager.tokenLockCount = manager.tokenLockCount.plus(BigInt.fromI32(1))
  manager.save()

  // New token lock wallet
  let id = event.params.contractAddress.toHexString()
  log.warning("[TOKEN LOCK CREATED] id used: {}", [id])
  let tokenLock = new TokenLockWallet(id)
  log.warning("[TOKEN LOCK] manager: {}", [event.address.toHexString()])
  tokenLock.manager = manager.id
  tokenLock.initHash = event.params.initHash
  tokenLock.beneficiary = event.params.beneficiary
  tokenLock.token = event.params.token
  tokenLock.managedAmount = event.params.managedAmount
  tokenLock.balance = event.params.managedAmount
  tokenLock.startTime = event.params.startTime
  tokenLock.endTime = event.params.endTime
  tokenLock.periods = event.params.periods
  tokenLock.releaseStartTime = event.params.releaseStartTime
  tokenLock.vestingCliffTime = event.params.vestingCliffTime
  tokenLock.tokenDestinationsApproved = false
  tokenLock.tokensWithdrawn = BigInt.fromI32(0)
  tokenLock.tokensRevoked = BigInt.fromI32(0)
  tokenLock.tokensReleased = BigInt.fromI32(0)
  tokenLock.blockNumberCreated = event.block.number
  tokenLock.txHash = event.transaction.hash
  tokenLock.lockAccepted = false
  if (event.params.revocable == 0) {
    tokenLock.revocable = "NotSet"
  } else if (event.params.revocable == 1) {
    tokenLock.revocable = "Enabled"
  } else {
    tokenLock.revocable = "Disabled"
  }
  tokenLock.save()
  log.warning("[TOKEN LOCK CREATED] entity saved with id: {}", [id])
  increaseSummaryBalance(event.params.managedAmount)
  MoxieTokenLockWallet.create(event.params.contractAddress)
}

export function handleTokensDeposited(event: TokensDeposited): void {
  // Get manager
  let manager = TokenLockManager.load(event.address.toHexString())!
  manager.tokens = manager.tokens.plus(event.params.amount)
  manager.save()
}

export function handleTokensWithdrawn(event: TokensWithdrawn): void {
  // Get manager
  let manager = TokenLockManager.load(event.address.toHexString())!
  manager.tokens = manager.tokens.minus(event.params.amount)
  manager.save()
}

export function handleFunctionCallAuth(event: FunctionCallAuth): void {
  // Calculate primary key
  let fid = event.params.signature
    .concat("-")
    .concat(event.address.toHexString())

  // Delete the entity if auth revoked
  if (event.params.target == Address.zero()) {
    store.remove("AuthorizedFunction", fid)
    return
  }

  // Save authorized function
  let auth = new AuthorizedFunction(fid)
  auth.sig = event.params.signature
  auth.target = event.params.target
  auth.sigHash = event.params.sigHash
  auth.manager = event.address.toHexString()
  auth.save()
}

export function handleTokenDestinationAllowed(
  event: TokenDestinationAllowed
): void {
  // Get manager
  let manager = TokenLockManager.load(event.address.toHexString())!

  // Update destinations
  let destinations = manager.tokenDestinations
  if (destinations == null) {
    destinations = []
  }
  let index = destinations.indexOf(event.params.dst)

  // It was not there before
  if (index == -1) {
    // Lets add it in
    if (event.params.allowed) {
      destinations.push(event.params.dst)
    }
    // If false was passed, we do nothing
    // It was there before
  } else {
    // We are revoking access
    if (!event.params.allowed) {
      destinations.splice(index, 1)
    }
    // Otherwise do nothing
  }
  manager.tokenDestinations = destinations
  manager.save()
}

export function handleMoxiePassTokenUpdated(
  event: MoxiePassTokenUpdated
): void {
  let manager = TokenLockManager.load(event.address.toHexString())!
  manager.moxiePassToken = event.params.moxiePassToken
  manager.save()
}

export function handleSubjectTokenDestinationAllowed(
  event: SubjectTokenDestinationAllowed
): void {
  let manager = TokenLockManager.load(event.address.toHexString())!
 // Update destinations
 let destinations = manager.subjectTokenDestinations
 if (destinations == null) {
   destinations = []
 }
 let index = destinations.indexOf(event.params.dst)

 // It was not there before
 if (index == -1) {
   // Lets add it in
   if (event.params.allowed) {
     destinations.push(event.params.dst)
   }
   // If false was passed, we do nothing
   // It was there before
 } else {
   // We are revoking access
   if (index != -1 && !event.params.allowed) {
     destinations.splice(index, 1)
   }
   // Otherwise do nothing
 }
 manager.subjectTokenDestinations = destinations
 manager.save()
}

export function handleTokenManagerUpdated(
  event: TokenManagerUpdated,
): void {
  let manager = TokenLockManager.load(event.params.tokenManager.toHexString())!
  manager.tokenManager = event.params.tokenManager
  manager.save()
}