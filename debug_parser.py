
MONTHS = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}

lines = [
    "30 de junho\t20577...",
    "1 de julho\t32642..."
]

for line in lines:
    parts = line.strip().split('\t')
    date_str = parts[0].strip()
    d_parts = date_str.split(' de ')
    day = int(d_parts[0])
    month_name = d_parts[1].lower()
    month = MONTHS[month_name]
    print(f"Original: {date_str} -> Mês Nome: {month_name} -> Mês Num: {month}")

