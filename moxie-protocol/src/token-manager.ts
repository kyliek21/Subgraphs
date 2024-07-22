import { TokenDeployed } from "../generated/TokenManager/TokenManager"
import { SubjectTokenContract } from "../generated/templates"

import { getOrCreateSubjectToken, getOrCreateUser, saveSubjectToken } from "./utils"

// emitted when a new SubjectErc20 is deployed
export function handleTokenDeployed(event: TokenDeployed): void {
  let token = event.params._token
  let subjectToken = getOrCreateSubjectToken(token, null, event.block)
  let user = getOrCreateUser(event.params._beneficiary, event.block)
  subjectToken.subject = user.id
  saveSubjectToken(subjectToken, event.block)
  SubjectTokenContract.create(token)
}
