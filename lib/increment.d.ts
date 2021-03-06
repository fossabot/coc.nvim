import { Neovim } from 'neovim';
import { CompleteOption, VimCompleteItem } from './types';
import Input from './model/input';
export interface CompleteDone {
    word: string;
    timestamp: number;
    colnr: number;
    linenr: number;
}
export interface InsertedChar {
    character: string;
    timestamp: number;
}
export interface ChangedI {
    linenr: number;
    colnr: number;
    timestamp: number;
}
export default class Increment {
    private nvim;
    activted: boolean;
    input: Input | null | undefined;
    done: CompleteDone | null | undefined;
    lastInsert: InsertedChar | null | undefined;
    option: CompleteOption | null | undefined;
    changedI: ChangedI | null | undefined;
    constructor(nvim: Neovim);
    stop(): Promise<void>;
    readonly latestDone: CompleteDone | null;
    readonly latestTextChangedI: ChangedI | null;
    /**
     * start
     *
     * @public
     * @param {string} input - current user input
     * @param {string} word - the word before cursor
     * @returns {Promise<void>}
     */
    start(option: CompleteOption): Promise<void>;
    onCompleteDone(item: VimCompleteItem | null): Promise<void>;
    onCharInsert(ch: string): Promise<void>;
    private getStartOption();
    onTextChangedI(): Promise<boolean>;
}
