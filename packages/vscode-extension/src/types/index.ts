// Callback for commit events
export type CommitCallback = () => void | Promise<void>

export interface RepoDetails {
  owner: string
  name: string
}
