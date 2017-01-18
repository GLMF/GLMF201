ASM=nasm

hello: hello.o
	ld -m elf_i386 -o $@ hello.o

hello.o: hello.asm mylib.asm
	$(ASM) -f elf -o $@ hello.asm

clean:
	rm *.o hello
