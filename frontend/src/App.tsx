import { ChakraProvider, Container } from '@chakra-ui/react'
import AvatarGenerator from './components/AvatarGenerator'

function App() {
  return (
    <ChakraProvider>
      <Container maxW="container.xl" py={8}>
        <AvatarGenerator />
      </Container>
    </ChakraProvider>
  )
}

export default App
