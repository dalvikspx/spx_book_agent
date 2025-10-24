#!/bin/bash

PDF_FILE="Discovering_SPX6900_The_World's_First_Pure_Belief_Asset_E_book.pdf"
OUTPUT_DIR="extracted_images"
TEMP_PREFIX="temp_img"

# Crea directory di output se non esiste
mkdir -p "$OUTPUT_DIR"

# Estrai tutte le immagini in una directory temporanea
echo "Estrarre immagini dal PDF..."
pdfimages -png "$PDF_FILE" "$OUTPUT_DIR/$TEMP_PREFIX"

# Ottieni la lista delle immagini con i numeri di pagina
echo "Mappare immagini alle pagine..."
prev_page=""
page_img_counter=0

pdfimages -list "$PDF_FILE" | tail -n +3 | while read -r line; do
    # Estrai numero di pagina (prima colonna) e indice immagine (seconda colonna)
    page_num=$(echo "$line" | awk '{print $1}')
    img_index=$(echo "$line" | awk '{print $2}')

    # Salta se non è una riga valida
    if [[ ! "$page_num" =~ ^[0-9]+$ ]]; then
        continue
    fi

    # Reset del contatore quando cambia la pagina
    if [ "$page_num" != "$prev_page" ]; then
        page_img_counter=1
        prev_page="$page_num"

        # Crea directory per la pagina con formato page-XXX (3 cifre con zero-padding)
        page_dir=$(printf "%s/page-%03d" "$OUTPUT_DIR" "$page_num")
        mkdir -p "$page_dir"

        # Rimuovi immagini esistenti nella directory prima di estrarre quelle nuove
        rm -f "$page_dir"/*.png
    else
        ((page_img_counter++))
    fi

    # Trova e sposta l'immagine corrispondente
    # pdfimages usa un formato con padding (es: temp_img-000.png)
    img_file=$(printf "%s-%03d.png" "$OUTPUT_DIR/$TEMP_PREFIX" "$img_index")

    if [ -f "$img_file" ]; then
        new_name=$(printf "%s/page-%03d-img-%02d.png" "$page_dir" "$page_num" "$page_img_counter")
        mv "$img_file" "$new_name"
        echo "Pagina $page_num: immagine $page_img_counter salvata"
    fi
done

# Pulisci eventuali file temporanei rimasti
rm -f "$OUTPUT_DIR/$TEMP_PREFIX"-*.png

echo "Estrazione completata! Le immagini sono in $OUTPUT_DIR/page-*/"
