bits 16			; mode 16 bit
org 0x7C00		; origine du programme

	jmp boot

display_enable:
	push bp
	mov bp, sp

	mov ah, 0h
	mov al, 07h 	;Text mode, monochrome, 80x25

	int 10h

	mov sp, bp
	pop bp
	ret

print:
	push bp
	mov bp, sp
	
	mov si, [bp + 4]; place le premier argument de la fonction dans le registre si

.loop:
	lodsb
	cmp al, 0	; verifie si la chaine est fini par un 0
	je .end

	mov ah, 0eh
	mov bx, 0
	int 10h

	jmp .loop	; continue

.end:
	mov sp, bp
	pop bp
	ret

println:
	push bp
	mov bp, sp
	
	push word [bp + 4]; passe les arguments
	call print
	add sp, 2

	mov ah, 03h	; read cursor position
	int 10h		; put row number in dh and column in dl
	
	inc dh
	mov dl, 0	; positionne le curseur sur la ligne suivante

	mov ah, 02h
	mov bx, 0
	int 10h

	mov sp, bp
	pop bp
	ret

hello_world: db 'Hello world', 0
linux_magazine: db 'GNU Linux Magazine France', 0

boot:
	sti

	call display_enable

	push hello_world
	call println
	add sp, 2

	push linux_magazine
	call println
	add sp, 2

times 510 - ($ - $$) db 0 	; octets de bourrage
dw 0xAA55			; mbr magic number
