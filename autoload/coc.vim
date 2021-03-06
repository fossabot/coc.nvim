let g:coc#_context = {}

" private
function! coc#get_config(...)
  return {
        \ 'completeOpt': &completeopt,
        \ 'hasUserData': has('nvim-0.2.3'),
        \ 'fuzzyMatch': get(g:, 'coc_fuzzy_match', v:null),
        \ 'timeout': get(g:, 'coc_timeout', v:null),
        \ 'checkGit': get(g:, 'coc_ignore_git_ignore', v:null),
        \ 'sourceConfig': get(g:, 'coc_source_config', v:null),
        \ 'incrementHightlight': get(g:, 'coc_increment_highlight', v:null),
        \ 'noSelect': get(g:, 'coc_use_noselect', v:null),
        \ 'signatureEvents': get(g:, 'coc_signature_events', v:null),
        \}
endfunction

function! coc#refresh() abort
    return pumvisible() ? "\<c-y>\<c-r>=coc#start()\<CR>" : "\<c-r>=coc#start()\<CR>"
endfunction

function! coc#_complete() abort
  call complete(g:coc#_context.start + 1,
      \ g:coc#_context.candidates)
  return ''
endfunction

function! coc#_do_complete() abort
  call feedkeys("\<Plug>_", 'i')
endfunction

function! coc#_hide() abort
  if !pumvisible() | return | endif
  call feedkeys("\<C-e>", 'in')
endfunction

function! coc#_confirm() abort
  call feedkeys("\<C-y>", 'in')
endfunction

function! coc#start()
  if !get(g:, 'coc_enabled', 0) 
    call coc#util#on_error('Service not running!')
    return ''
  endif
  let pos = getcurpos()
  let line = getline('.')
  let l:start = pos[2] - 1
  while l:start > 0 && line[l:start - 1] =~# '\k'
    let l:start -= 1
  endwhile
  let input = line[l:start : pos[2] - 2]
  let opt = {
        \ 'id': localtime(),
        \ 'changedtick': b:changedtick,
        \ 'word': matchstr(line[l:start : ], '^\k\+'),
        \ 'input': input,
        \ 'line': getline('.'),
        \ 'buftype': &buftype,
        \ 'filetype': &filetype,
        \ 'filepath': expand('%:p'),
        \ 'bufnr': bufnr('%'),
        \ 'linenr': pos[1],
        \ 'colnr' : pos[2],
        \ 'col': l:start,
        \ 'linecount': line('$'),
        \ 'iskeyword': &iskeyword,
        \ }
  call CocStart(opt)
  return ''
endfunction
