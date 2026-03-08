#csv to js map
og_csv = open("QR Code N&Blocks.csv", "r")

og_csv.readline()#header

for version in range(1, 40+1):
    n_per_block, num_blocks = og_csv.readline().split(sep=',')[2:]
    print(f"{version}, {}")
