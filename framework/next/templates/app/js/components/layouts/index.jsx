'use client';

import { Center, VStack } from '@yamada-ui/react';

export const Layout = ({ ...rest }) => {
  return (
    <>
      <Center as="main" w="full">
        <VStack
          alignItems="flex-start"
          w="full"
          maxW="9xl"
          gap={{ base: 'lg', md: 'md' }}
          py="lg"
          px={{ base: 'lg', md: 'md' }}
          {...rest}
        />
      </Center>
    </>
  );
};
