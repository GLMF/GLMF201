section .text

print_string:
; print_string eax ebx
;    description : Print the string eax to stdout
;    eax : string
;    ebx : eax length
;    ret : none
    pusha
    mov ecx, eax
    mov edx, ebx
    mov ebx, 1
    mov eax, 4
    int 0x80    
    popa
    ret
