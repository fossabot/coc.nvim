import { Neovim } from 'neovim';
import { QueryOption, CompleteOption, CompleteResult } from '../../types';
import ServiceSource from '../../model/source-service';
export default class Tern extends ServiceSource {
    private service;
    private root;
    constructor(nvim: Neovim);
    onInit(): Promise<void>;
    private findProjectRoot(cwd);
    shouldComplete(opt: CompleteOption): Promise<boolean>;
    doComplete(opt: CompleteOption): Promise<CompleteResult>;
    showDefinition(query: QueryOption): Promise<void>;
    showDocuments(query: QueryOption): Promise<void>;
    jumpDefinition(query: QueryOption): Promise<void>;
    showSignature(query: QueryOption): Promise<void>;
}
