section .text
global  _start

%include "mylib.asm"

_start:
    mov eax, message
    mov ebx, length
    call print_string

    mov ebx, 0
    mov eax, 1
    int 0x80

    times 510-($-$$) db 0 
    dw 0AA55h

section .data
    message db 'Hello GLMF!', 10
    length equ $ - message
