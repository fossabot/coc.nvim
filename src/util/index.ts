import {VimCompleteItem} from '../types'
import {Neovim } from 'neovim'
import {getConfig} from '../config'
import debounce = require('debounce')
import net = require('net')
const logger = require('./logger')()

export type Callback = (arg: number|string) => void

export function escapeSingleQuote(str: string):string {
  return str.replace(/'/g, "''")
}

export async function echoErr(nvim: Neovim, line: string):Promise<void> {
  return await echoMsg(nvim, line, 'Error')
}

export async function echoWarning(nvim: Neovim, line: string):Promise<void> {
  return await echoMsg(nvim, line, 'MoreMsg')
}

export async function echoErrors(nvim: Neovim, lines: string[]):Promise<void> {
  await nvim.call('coc#util#print_errors', lines)
}

export function getUserData(item:VimCompleteItem):{[index: string]: any} | null {
  let userData = item.user_data
  if (!userData) return null
  try {
    let res = JSON.parse(userData)
    return res.hasOwnProperty('cid') ? res : null
  } catch (e) {
    return null
  }
}

// create dobounce funcs for each arg
export function contextDebounce(func: Callback, timeout: number):Callback {
  let funcMap: {[index: string] : Callback | null} = {}
  return (arg: string | number): void => {
    let fn = funcMap[arg]
    if (fn == null) {
      fn = debounce(func.bind(null, arg), timeout, false)
      funcMap[arg.toString()] = fn
    }
    fn(arg)
  }
}

export function wait(ms: number):Promise<any> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

async function echoMsg(nvim:Neovim, line: string, hl: string):Promise<void> {
  try {
    await nvim.command(`echohl ${hl} | echomsg '[coc.nvim] ${escapeSingleQuote(line)}' | echohl None"`)
  } catch (e) {
    logger.error(e.stack)
  }
  return
}

export function isCocItem(item: any):boolean {
  if (!item ||!item.hasOwnProperty('word')) return false
  if (Object.keys(item).length == 0) return false
  let hasUserData = getConfig('hasUserData')
  // NVIM doesn't support user_data
  if (!hasUserData) return true
  let {user_data} = item
  if (!user_data) return false
  try {
    let res = JSON.parse(user_data)
    return res.cid != null
  } catch (e) {
    return false
  }
}

export function filterWord(input: string, word: string, icase: boolean):boolean {
  if (!icase) return word.startsWith(input)
  return word.toLowerCase().startsWith(input.toLowerCase())
}

function getValidPort(port:number, cb:(port:number)=>void):void {
  let server = net.createServer()
  server.listen(port, () => {
    server.once('close', () => {
      cb(port)
    })
    server.close()
  })
  server.on('error', () => {
    port += 1
    getValidPort(port, cb)
  })
}

export function getPort(port = 44877):Promise<number> {
  return new Promise(resolve => {
    getValidPort(port, result => {
      resolve(result)
    })
  })
}

export function toBool(s:number|string|boolean):boolean {
  if (s == '0') return false
  return !!s
}
