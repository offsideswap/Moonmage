import React, { useState } from 'react';
import { Box, CircularProgress, Stack } from '@mui/material';
import { BASE_IPFS_LINK, MOONFT_GENESIS_ADDRESSES, MOONFT_WINTER_ADDRESSES } from '../../constants';
import { MoonmagePalette } from '~/components/App/muiTheme';
import { Nft } from '~/util';

import { FC } from '~/types';

export interface NFTContentProps {
  nft: Nft;
}

/** Maps an NFT collection to its ETH address. */
export const nftCollections: {[c: string]: string} = {
  Genesis: MOONFT_GENESIS_ADDRESSES[1],
  Winter: MOONFT_WINTER_ADDRESSES[1]
};

const NFTImage: FC<NFTContentProps> = ({
  nft,
}) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  return (
    <>
      <Box display={loaded ? 'block' : 'none'}>
        <img
          onLoad={() => setLoaded(true)}
          src={`${BASE_IPFS_LINK}${nft.imageIpfsHash}`}
          alt=""
          width="100%"
          css={{ display: 'block', borderRadius: '7px', aspectRatio: '1/1' }}
        />
      </Box>
      {!loaded && (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            width: '100%',
            aspectRatio: '1/1',
            borderRadius: '7px',
            backgroundColor: MoonmagePalette.lightestBlue
          }}>
          <CircularProgress />
        </Stack>
      )}
    </>
  );
};

export default NFTImage;
