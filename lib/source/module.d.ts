import { Neovim } from 'neovim';
import { CompleteOption, CompleteResult } from '../types';
import Source from '../model/source';
export default class Module extends Source {
    constructor(nvim: Neovim);
    onInit(): Promise<void>;
    shouldComplete(opt: CompleteOption): Promise<boolean>;
    doComplete(opt: CompleteOption): Promise<CompleteResult>;
}
