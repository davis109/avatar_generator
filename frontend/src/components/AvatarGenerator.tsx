import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Stack,
  Image,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Heading,
  Spinner,
  Flex,
  useToast,
  Progress,
} from '@chakra-ui/react'
import { useDropzone } from 'react-dropzone'
import { FaDownload, FaShare, FaChevronDown } from 'react-icons/fa'
import axios, { AxiosError } from 'axios'

const STYLES = {
  anime: 'Anime',
  cyberpunk: 'Cyberpunk',
  fantasy: 'Fantasy',
  business: 'Business',
} as const

type StyleType = keyof typeof STYLES

const AvatarGenerator = () => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [style, setStyle] = useState<StyleType>('anime')
  const [loading, setLoading] = useState(false)
  const [generatedAvatar, setGeneratedAvatar] = useState<string>('')
  const [waitTime, setWaitTime] = useState<number>(0)
  const toast = useToast()

  useEffect(() => {
    let timer: number
    if (waitTime > 0) {
      timer = window.setInterval(() => {
        setWaitTime(prev => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [waitTime])

  const checkRateLimit = async () => {
    try {
      const response = await axios.get('http://localhost:8000/rate-limit-status')
      if (!response.data.can_request) {
        setWaitTime(response.data.wait_time)
        return false
      }
      return true
    } catch (error) {
      console.error('Error checking rate limit:', error)
      return true // Allow request if rate limit check fails
    }
  }

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }
      setFile(selectedFile)
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreview(objectUrl)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const handleGenerate = async () => {
    if (!file) {
      toast({
        title: 'No image selected',
        description: 'Please upload an image first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const canProceed = await checkRateLimit()
    if (!canProceed) {
      const minutes = Math.floor(waitTime / 60)
      const seconds = waitTime % 60
      toast({
        title: 'Rate Limit',
        description: `Please wait ${minutes} minutes and ${seconds} seconds before generating another avatar`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      console.log('Sending request to backend...')
      const response = await axios.post(
        `http://localhost:8000/generate-avatar?style=${style}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      console.log('Response received:', response.data)
      if (response.data.image_url) {
        setGeneratedAvatar(response.data.image_url)
      } else {
        throw new Error('No image URL in response')
      }
    } catch (error) {
      console.error('Error details:', error)
      let errorMessage = 'Failed to generate avatar. Please try again.'
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>
        if (axiosError.response?.status === 429) {
          const waitTimeMatch = axiosError.response.data.detail.match(/wait (\d+) minutes and (\d+) seconds/)
          if (waitTimeMatch) {
            const minutes = parseInt(waitTimeMatch[1])
            const seconds = parseInt(waitTimeMatch[2])
            setWaitTime(minutes * 60 + seconds)
          }
          errorMessage = axiosError.response.data.detail
        } else if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail
        } else if (axiosError.message) {
          errorMessage = axiosError.message
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (generatedAvatar) {
      const link = document.createElement('a')
      link.href = generatedAvatar
      link.download = `stylized-avatar-${style}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleShare = async () => {
    if (generatedAvatar) {
      try {
        await navigator.share({
          title: 'My Stylized Avatar',
          text: 'Check out my stylized avatar!',
          url: generatedAvatar,
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to share. Your browser might not support sharing.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    }
  }

  const formatWaitTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Stack spacing={6}>
      <Heading textAlign="center">AI Avatar Generator</Heading>

      <Box
        {...getRootProps()}
        p={6}
        border="2px dashed"
        borderColor={isDragActive ? 'blue.400' : 'gray.200'}
        borderRadius="lg"
        textAlign="center"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ borderColor: 'blue.400' }}
      >
        <input {...getInputProps()} />
        {preview ? (
          <Image
            src={preview}
            alt="Preview"
            maxH="200px"
            mx="auto"
            objectFit="contain"
          />
        ) : (
          <Text>Drag and drop an image here, or click to select (max 5MB)</Text>
        )}
      </Box>

      <Menu>
        <MenuButton as={Button} rightIcon={<FaChevronDown />}>
          {STYLES[style]}
        </MenuButton>
        <MenuList>
          {Object.entries(STYLES).map(([value, label]) => (
            <MenuItem
              key={value}
              onClick={() => setStyle(value as StyleType)}
            >
              {label}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>

      {waitTime > 0 && (
        <Box>
          <Text textAlign="center" mb={2}>
            Next generation available in: {formatWaitTime(waitTime)}
          </Text>
          <Progress
            value={(300 - waitTime) / 3}
            size="sm"
            colorScheme="blue"
            isAnimated
          />
        </Box>
      )}

      <Button
        colorScheme="blue"
        onClick={handleGenerate}
        isDisabled={loading || !file || waitTime > 0}
      >
        {loading ? 'Generating...' : 'Generate Avatar'}
      </Button>

      {loading && (
        <Flex direction="column" align="center">
          <Spinner size="xl" />
          <Text mt={2}>Creating your stylized avatar...</Text>
        </Flex>
      )}

      {generatedAvatar && (
        <Box>
          <Image
            src={generatedAvatar}
            alt="Generated Avatar"
            maxH="400px"
            mx="auto"
            objectFit="contain"
          />
          <Flex justify="center" mt={4} gap={4}>
            <Button
              leftIcon={<FaDownload />}
              onClick={handleDownload}
              colorScheme="green"
            >
              Download
            </Button>
            <Button
              leftIcon={<FaShare />}
              onClick={handleShare}
              colorScheme="blue"
            >
              Share
            </Button>
          </Flex>
        </Box>
      )}
    </Stack>
  )
}

export default AvatarGenerator 