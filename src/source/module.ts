import { Neovim } from 'neovim'
import {CompleteOption, CompleteResult} from '../types'
import Source from '../model/source'
import * as fs from 'fs'
import path = require('path')
import pify = require('pify')
const logger = require('../util/logger')('source-module')
const baseDir = path.join(__dirname, 'module_resolve')

export default class Module extends Source {
  constructor(nvim: Neovim) {
    super(nvim, {
      name: 'module',
      shortcut: 'M',
      priority: 0,
      engross: 1,
      filetypes: []
    })
  }

  public async onInit(): Promise<void> {
    let files = await pify(fs.readdir)(baseDir)
    files = files.filter(f => /\.js$/.test(f))
    let filetypes = files.map(f => f.replace(/\.js$/, ''))
    this.config.filetypes = filetypes
  }

  public async shouldComplete(opt: CompleteOption): Promise<boolean> {
    let {filetype} = opt
    if (!this.checkFileType(filetype)) return false
    let {shouldResolve} = require(path.join(baseDir, filetype))
    return await shouldResolve(opt)
  }

  public async doComplete(opt: CompleteOption): Promise<CompleteResult> {
    let {filetype} = opt
    let {resolve} = require(path.join(baseDir, filetype))
    let words = await resolve(opt)
    return {
      items: words.map(word => {
        return {
          word,
          menu: this.menu
        }
      })
    }
  }
}
