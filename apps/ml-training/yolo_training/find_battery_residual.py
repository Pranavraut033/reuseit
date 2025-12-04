import csv


def find_battery_in_residual_waste(csv_file_path):
    """
    Finds items that have 'battery' in their filename but are classified as 'residual_waste'.

    Args:
        csv_file_path (str): Path to the YOLO labels CSV file.

    Returns:
        list: List of dictionaries containing the rows that match the criteria.
    """
    matching_items = []

    with open(csv_file_path, "r") as file:
        reader = csv.DictReader(file)
        for row in reader:
            filename = row["filename"]
            # Extract category from filename (part before first '/')
            category = filename.split("/")[0]

            # Check if 'battery' is in filename and category is 'residual_waste'
            if "battery" in filename and category == "residual_waste":
                matching_items.append(row)

    return matching_items


# Example usage
if __name__ == "__main__":
    csv_file = "yolo_labels.csv"
    results = find_battery_in_residual_waste(csv_file)
    if results:
        print(
            f"Found {len(results)} item(s) with 'battery' in name but classified as 'residual_waste':"
        )
        for item in results:
            print(item)
    else:
        print("No items found matching the criteria.")
