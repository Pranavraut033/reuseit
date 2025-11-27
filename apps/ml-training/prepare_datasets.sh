#!/bin/bash

# Script to prepare ML datasets with virtual environment activated
# Usage: ./prepare_datasets.sh [options]
#
# Options:
#   --clean    Delete existing datasets with confirmation before preparing
#   --clear    Delete raw datasets after successful preparation

set -e  # Exit on any error

# Parse command line arguments
CLEAN=false
CLEAR=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --clear)
            CLEAR=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --clean    Delete existing datasets with confirmation before preparing"
            echo "  --clear    Delete raw datasets after successful preparation"
            echo "  --help     Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "=== ReUseIt Dataset Preparation Script ==="

# Handle --clean flag
if [ "$CLEAN" = true ]; then
    echo "Clean flag enabled. Checking for existing datasets..."

    DATASETS_EXIST=false
    if [ -d "raw_datasets" ] || [ -d "merged_dataset" ]; then
        DATASETS_EXIST=true
    fi

    if [ "$DATASETS_EXIST" = true ]; then
        echo "Found existing datasets:"
        [ -d "raw_datasets" ] && echo "  - raw_datasets/"
        [ -d "merged_dataset" ] && echo "  - merged_dataset/"
        echo ""
        read -p "Delete existing datasets? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Deleting existing datasets..."
            [ -d "raw_datasets" ] && rm -rf "raw_datasets"
            [ -d "merged_dataset" ] && rm -rf "merged_dataset"
            echo "Existing datasets deleted."
        else
            echo "Keeping existing datasets."
        fi
    else
        echo "No existing datasets found to clean."
    fi
fi

echo "Activating virtual environment..."

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Error: Virtual environment not found at .venv"
    echo "Please run: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
source .venv/bin/activate

echo "Virtual environment activated: $VIRTUAL_ENV"
echo "Preparing datasets..."

# Run dataset preparation
python -c "from dataset_utils import prepare_datasets; prepare_datasets()"

echo "Dataset preparation completed successfully!"

# Handle --clear flag
if [ "$CLEAR" = true ]; then
    echo "Clear flag enabled. Deleting raw datasets..."
    if [ -d "raw_datasets" ]; then
        rm -rf "raw_datasets"
        echo "Raw datasets deleted."
    else
        echo "No raw datasets directory found to clear."
    fi
fi

# Deactivate virtual environment
deactivate

echo "Virtual environment deactivated."
echo "=== Done ==="
