with open('/Users/simha/Documents/Hack Club Code/Flavortown/QR-Code-Generator/QR Code N&Blocks.csv', 'r') as infile, open('info.csv', 'w') as outfile:
    lines = infile.readlines()
    
    for line in lines:
        try:
            v = int(line.split(",")[0])
            new_line = line.strip() + f",{21+(v-1)*4}\n"
        except ValueError:
            new_line = line.strip() + ",Size\n"
        
        outfile.write(new_line)

