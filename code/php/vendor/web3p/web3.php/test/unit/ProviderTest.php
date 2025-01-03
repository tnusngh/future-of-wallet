<?php

namespace Test\Unit;

use Test\TestCase;
use Web3\RequestManagers\RequestManager;
use Web3\Providers\Provider;

class ProviderTest extends TestCase
{
    /**
     * testSetRequestManager
     * 
     * @return void
     */
    public function testSetRequestManager()
    {
        $requestManager = new RequestManager('http://localhost:8545');
        $provider = new Provider($requestManager);

        $this->assertEquals($provider->requestManager->host, 'http://localhost:8545');

        $requestManager = new RequestManager($this->testHost2);
        $provider->requestManager = $requestManager;

        // there is no setter for request manager
        $this->assertEquals($provider->requestManager->host, 'http://localhost:8545');
    }
}