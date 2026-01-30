// Test pdfjs-dist implementation
async function testPdfJsDist() {
  console.log('🧪 Testing pdfjs-dist implementation...')

  try {
    const fs = require('fs')
    const path = require('path')

    const testPdfPath = path.join(__dirname, 'test-resume.pdf')

    if (!fs.existsSync(testPdfPath)) {
      console.log('❌ No test PDF found')
      return false
    }

    const pdfBuffer = fs.readFileSync(testPdfPath)
    console.log('📄 PDF size:', pdfBuffer.length, 'bytes')

    // Load pdfjs-dist
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs')
    console.log('✅ pdfjs-dist loaded successfully')

    // Configure worker with string path
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs'
    console.log('✅ Worker configured')

    // Load PDF document using Uint8Array
    const uint8Array = new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.length)
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
    const pdf = await loadingTask.promise
    console.log('✅ PDF loaded, pages:', pdf.numPages)

    // Extract text from all pages
    let extractedText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => item.str)
        .join(' ')
      extractedText += pageText + '\n\n'
    }

    console.log('✅ Text extracted successfully!')
    console.log('Text length:', extractedText.length, 'characters')
    console.log('\nExtracted text:')
    console.log(extractedText)

    return true
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

testPdfJsDist()
  .then((success) => {
    console.log('\n' + (success ? '✅ All tests passed!' : '❌ Tests failed!'))
    process.exit(success ? 0 : 1)
  })
