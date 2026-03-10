#csv to js map
og_csv = open("info.csv", "r")

og_csv.readline()#header

per_block_array = [[0], [0], [0], [0]]#low first then increase order
num_blocks_array = [[0], [0], [0], [0]]#Fill with zeros intially so when i doe the version num input later, i wont have to do value-1 for 0 indexed
size_array = [0]
for version in range(1, 40+1):
    n_per_block, num_blocks, size = og_csv.readline().split(sep=',')[2:]
    n_per_block, num_blocks = [int(i) for i in n_per_block.split(sep=" / ")], [int(i) for i in num_blocks.split(sep=" / ")]
    size = int(size)

    for level in range(4):
        per_block_array[level].append(n_per_block[level])
        num_blocks_array[level].append(num_blocks[level])
        size_array.append(size)

levels = ["L", "M", "Q", "H"]
formatBits = ["01", "00", "11", "10"]
for level in range(4):
    print(f"{levels[level]}Map.set('formatBits', '{formatBits[level]}');")
    print(f"{levels[level]}Map.set('n_per_block', '{per_block_array[level]}');")
    print(f"{levels[level]}Map.set('num_blocks', '{num_blocks_array[level]}');")
    print(f"{levels[level]}Map.set('size', '{num_blocks_array[level]}');")
    print()
