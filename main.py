code_file = open("Code.txt", "r")
contents = code_file.read()
code_file.close()

js_file = open("jsMatrix.txt", "w")
contents = contents.split(sep="\n")

curr = []
for row in contents:
    if row == "":
        js_file.write("".join(curr)+"\n],\n\n[\n")
        curr = []
    else:
        curr.append(f"\n    [{row}],")
js_file.close()
