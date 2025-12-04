import csv


def replace_residual_waste_with_battery(csv_file_path):
    """
    Replaces 'residual_waste' with 'battery' in the category (filename prefix) for items
    that have 'battery' in their filename but are currently classified as 'residual_waste'.

    Args:
        csv_file_path (str): Path to the YOLO labels CSV file.

    Returns:
        int: Number of rows updated.
    """
    updated_count = 0
    rows = []

    # Read all rows
    with open(csv_file_path, "r") as file:
        reader = csv.DictReader(file)
        rows = list(reader)

    # Update matching rows
    for row in rows:
        filename = row["filename"]
        # Check if filename contains 'battery' and category is 'residual_waste'
        if "battery" in filename and filename.startswith("residual_waste/"):
            # Replace 'residual_waste/' with 'battery/' at the start
            row["filename"] = filename.replace("residual_waste/", "battery/", 1)
            updated_count += 1

    # Write back to CSV
    with open(csv_file_path, "w", newline="") as file:
        if rows:
            writer = csv.DictWriter(file, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)

    return updated_count


# Example usage
if __name__ == "__main__":
    csv_file = "yolo_labels.csv"
    updated = replace_residual_waste_with_battery(csv_file)
    print(
        f"Updated {updated} rows: changed 'residual_waste' to 'battery' for items with 'battery' in filename."
    )
