import { exec } from 'node:child_process'

/**
 * Executes a shell command in the specified directory
 * @param command Command to execute
 * @param cwd Working directory
 * @returns Promise with the command output
 */
export async function runCommand(command: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command "${command}" failed: ${error.message}\n${stderr}`))
        return
      }
      resolve(stdout.trim())
    })
  })
}
