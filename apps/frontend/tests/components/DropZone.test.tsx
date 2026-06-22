import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DropZone from '@/components/upload/DropZone'

function createFile(name: string, type: string, sizeBytes: number): File {
  const file = new File(['x'.repeat(sizeBytes)], name, { type })
  return file
}

describe('DropZone', () => {
  it('should render the default empty state when no file is selected', () => {
    render(<DropZone selectedFile={null} onFileSelected={vi.fn()} />)

    expect(
      screen.getByText('Drag and drop your receipt here')
    ).toBeInTheDocument()
    expect(screen.getByText('or click to browse')).toBeInTheDocument()
  })

  it('should render the selected file name when a file is provided', () => {
    const file = createFile('receipt.jpg', 'image/jpeg', 1024)

    render(<DropZone selectedFile={file} onFileSelected={vi.fn()} />)

    expect(screen.getByText('receipt.jpg')).toBeInTheDocument()
    expect(
      screen.getByText('Click to choose a different file')
    ).toBeInTheDocument()
  })

  it('should call onFileSelected with the file when a valid file is selected via input', async () => {
    const onFileSelected = vi.fn()
    const file = createFile('receipt.jpg', 'image/jpeg', 1024)

    render(<DropZone selectedFile={null} onFileSelected={onFileSelected} />)

    const input = screen.getByDisplayValue('') as HTMLInputElement

    await userEvent.upload(input, file)

    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it('should reject a file with an invalid type and show an error message', () => {
    const onFileSelected = vi.fn()
    const file = createFile('document.txt', 'text/plain', 1024)

    render(<DropZone selectedFile={null} onFileSelected={onFileSelected} />)

    const dropzone = screen
      .getByText('Drag and drop your receipt here')
      .closest('div')!

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    })

    expect(onFileSelected).toHaveBeenCalledWith(null)
    expect(
      screen.getByText('Only JPEG, PNG, WEBP and PDF files are accepted.')
    ).toBeInTheDocument()
  })

  it('should reject a file larger than 10MB and show an error message', async () => {
    const onFileSelected = vi.fn()
    const file = createFile('huge.jpg', 'image/jpeg', 11 * 1024 * 1024)

    render(<DropZone selectedFile={null} onFileSelected={onFileSelected} />)

    const input = screen.getByDisplayValue('') as HTMLInputElement

    await userEvent.upload(input, file)

    expect(onFileSelected).toHaveBeenCalledWith(null)
    expect(
      screen.getByText('File size cannot exceed 10MB.')
    ).toBeInTheDocument()
  })

  it('should display the errorMessage prop when provided and no validation error exists', () => {
    render(
      <DropZone
        selectedFile={null}
        onFileSelected={vi.fn()}
        errorMessage="Upload failed on the server"
      />
    )

    expect(screen.getByText('Upload failed on the server')).toBeInTheDocument()
  })

  it('should call onFileSelected with null when the remove button is clicked', async () => {
    const onFileSelected = vi.fn()
    const file = createFile('receipt.jpg', 'image/jpeg', 1024)

    render(<DropZone selectedFile={file} onFileSelected={onFileSelected} />)

    const removeButton = screen.getByRole('button')

    await userEvent.click(removeButton)

    expect(onFileSelected).toHaveBeenCalledWith(null)
  })

  it('should not propagate click to the dropzone container when remove button is clicked', async () => {
    const onFileSelected = vi.fn()
    const file = createFile('receipt.jpg', 'image/jpeg', 1024)

    render(<DropZone selectedFile={file} onFileSelected={onFileSelected} />)

    const removeButton = screen.getByRole('button')

    await userEvent.click(removeButton)

    // onFileSelected should be called exactly once (from remove),
    // not twice (remove + dropzone click triggering the file input)
    expect(onFileSelected).toHaveBeenCalledTimes(1)
  })

  it('should handle drop event with a valid file', () => {
    const onFileSelected = vi.fn()
    const file = createFile('receipt.jpg', 'image/jpeg', 1024)

    render(<DropZone selectedFile={null} onFileSelected={onFileSelected} />)

    const dropzone = screen
      .getByText('Drag and drop your receipt here')
      .closest('div')!

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    })

    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it('should clear a previous validation error when a valid file is subsequently selected', () => {
    const onFileSelected = vi.fn()
    const invalidFile = createFile('document.txt', 'text/plain', 1024)
    const validFile = createFile('receipt.jpg', 'image/jpeg', 1024)

    render(<DropZone selectedFile={null} onFileSelected={onFileSelected} />)

    const dropzone = screen
      .getByText('Drag and drop your receipt here')
      .closest('div')!

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [invalidFile] },
    })

    expect(
      screen.getByText('Only JPEG, PNG, WEBP and PDF files are accepted.')
    ).toBeInTheDocument()

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [validFile] },
    })

    expect(
      screen.queryByText('Only JPEG, PNG, WEBP and PDF files are accepted.')
    ).not.toBeInTheDocument()
    expect(onFileSelected).toHaveBeenLastCalledWith(validFile)
  })
})
