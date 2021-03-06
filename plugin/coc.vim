if exists('did_coc_loaded') || v:version < 700
  finish
endif
let did_coc_loaded = 1
let s:timer = 0

function! s:Call(func, ...)
  if !empty(&buftype) | return | endif
  if !get(g:, 'coc_enabled', 0) | return | endif
  try
    call call('Coc'.a:func, a:000)
  catch /^Vim\%((\a\+)\)\=:E117/
    call s:OnFuncUndefined()
  endtry
endfunction

function! s:OnBuffer(type, bufnr, event) abort
  if s:IsInvalid(a:bufnr) | return | endif
  if !get(g:, 'coc_enabled', 0) | return | endif
  try
    execute 'call CocBuf'.a:type.'('.a:bufnr.',"'.a:event.'")'
  catch /^Vim\%((\a\+)\)\=:E117/
    call s:OnFuncUndefined()
  endtry
endfunction

function! s:OnFuncUndefined() abort
  call coc#util#on_error('Vim error, function not found')
  call s:Disable()
endfunction

function! s:IsInvalid(bufnr) abort
  let t = getbufvar(a:bufnr, '&buftype')
  if t ==# 'terminal'
        \|| t ==# 'nofile'
        \|| t ==# 'quickfix'
    return 1
  endif
  return 0
endfun

function! s:Disable() abort
  if get(g:, 'coc_enabled', 0) == 0
    return
  endif
  augroup coc_nvim
    autocmd!
  augroup end
  echohl MoreMsg
    echom '[coc.nvim] Disabled'
  echohl None
  let g:coc_enabled = 0
  if get(s:, 'timer', 0)
    call timer_stop(s:timer)
  endif
endfunction

function! s:ToggleSource(name) abort
  if !s:CheckState() | return | endif
  let state = CocSourceToggle(a:name)
  if !empty(state)
    echohl MoreMsg
    echom '[coc.nvim] Source '.a:name. ' '.state
    echohl None
  endif
endfunction

function! s:RefreshSource(...) abort
  if !s:CheckState() | return | endif
  let name = get(a:, 1, '')
  let succeed = CocSourceRefresh(name)
  if succeed
    echohl MoreMsg
    echom '[coc.nvim] Source '.name. ' refreshed'
    echohl None
  endif
endfunction

function! s:CheckState() abort
  let enabled = get(g:, 'coc_enabled', 0)
  if !enabled
    call coc#util#on_error('Service disabled')
  endif
  return enabled
endfunction

function! s:CocSourceNames(A, L, P) abort
  if !s:CheckState() | return | endif
  let items = CocSourceStat()
  return filter(map(items, 'v:val["name"]'), 'v:val =~ "^'.a:A.'"')
endfunction

function! s:Init(sync)
  let func = a:sync ? 'CocInitSync' : 'CocInitAsync'
  if a:sync
    echohl MoreMsg
    echom '[coc.nvim] Lazyload takes more time for initailize, consider disable lazyload'
    echohl None
  endif
  try
    execute 'call '.func.'()'
  catch /^Vim\%((\a\+)\)\=:E117/
    call coc#util#on_error('Initailize failed, try :UpdateRemotePlugins and restart')
  endtry
endfunction

function! s:Enable()
  if get(g:, 'coc_enabled', 0) == 1
    return
  endif
  augroup coc_nvim
    autocmd!
    autocmd FileType * call s:Call('FileTypeChange', expand('<amatch>'))
    autocmd InsertCharPre * call s:Call('InsertCharPre', v:char)
    autocmd CompleteDone * call s:Call('CompleteDone', v:completed_item)
    autocmd TextChangedP * call s:Call('TextChangedP')
    autocmd TextChangedI * call s:Call('TextChangedI')
    autocmd InsertLeave * call s:Call('InsertLeave')

    autocmd BufUnload * call s:OnBuffer('Unload', +expand('<abuf>'), 'BufUnload')
    autocmd BufLeave * call s:OnBuffer('Change', +expand('<abuf>'), 'BufLeave')
    autocmd TextChanged * if !&paste |call s:OnBuffer('Change', +expand('<abuf>'), 'TextChanged') | endif
    autocmd BufRead * call s:OnBuffer('Change', +expand('<abuf>'), 'BufRead')
    autocmd BufWritePost * call s:OnBuffer('Change', +expand('<abuf>'), 'BufWritePost')
  augroup end

  command! -nargs=1 -complete=customlist,s:CocSourceNames CocToggle :call s:ToggleSource(<f-args>)
  command! -nargs=? -complete=customlist,s:CocSourceNames CocRefresh :call s:RefreshSource(<f-args>)
  command! -nargs=0 CocDisable :call s:Disable()
  command! -nargs=0 CocEnable :call s:Enable()

  let guifg = get(g:, 'coc_chars_guifg', 'white')
  let guibg = get(g:, 'coc_chars_guibg', 'magenta')
  exec "highlight default CocChars guifg=".guifg." guibg=".guibg." ctermfg=white ctermbg=".(&t_Co < 256 ? "magenta" : "201")
  let g:coc_enabled = 1
  let s:timer = timer_start(5000, function('s:CheckStatus'), {
        \ 'repeat': -1
        \})
endfunction

function! s:CheckStatus(...)
  " check the node process is running
  let res = jobwait([get(g:, 'coc_node_channel_id', 0)], 10)
  if res[0] != -1
    call s:Disable()
  endif
endfunction

augroup coc_init
  autocmd!
  autocmd user CocNvimInit call s:Enable()
augroup end

nnoremap <silent> <Plug>(coc-jump-definition) :call CocJumpDefinition()<CR>
inoremap <silent> <Plug>_ <C-r>=coc#_complete()<CR>

if has('vim_starting')
  autocmd VimEnter * call s:Init(0)
else
  call s:Init(1)
endif
