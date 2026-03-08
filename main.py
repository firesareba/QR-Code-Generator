#csv to js map
og_csv = open("QR Code N&Blocks.csv", "r")

og_csv.readline()#header

per_block_array = [[0], [0], [0], [0]]#low first then increase order
num_blocks_array = [[0], [0], [0], [0]]#Fill with zeros intially so when i doe the version num input later, i wont have to do value-1 for 0 indexed
for version in range(1, 40+1):
    n_per_block, num_blocks = [[int(i) for i in column.split(sep=" / ")] for column in og_csv.readline().split(sep=',')[2:]]

    for level in range(4):
        per_block_array[level].append(n_per_block[level])
        num_blocks_array[level].append(num_blocks[level])
