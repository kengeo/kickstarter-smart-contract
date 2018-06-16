const ganache = require('ganache-cli');
const Web3 = require('web3');

const web3 = new Web3(ganache.provider());

const compiledFactory = require('../ethereum/build/CampaignFactory.json');
const compiledCampaign = require('../ethereum/build/Campaign.json');

describe('Inbox', async () => {
  let accounts;
  let factory;
  let campaignAddress;
  let campaign;

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
      .deploy({ data: compiledFactory.bytecode })
      .send({ from: accounts[0], gas: '1000000' });
  
    await factory.methods.createCampaign('100').send({
      from: accounts[0],
      gas: '1000000'
    });
  
    [campaignAddress] = await factory.methods.getDeployedCampaigns().call();
    campaign = await new web3.eth.Contract(
      JSON.parse(compiledCampaign.interface),
      campaignAddress
    );
  });

  it('deploys a factory and a campaign', () => {
    expect(factory.options.address).toBeTruthy()
    expect(campaign.options.address).toBeTruthy()
  });

  it('marks caller as the campaign manager', async () => {
    const manager = await campaign.methods.manager().call();
    expect(accounts[0]).toEqual(manager)
  });

  it('allows people to contribute money and marks them as approvers', async () => {
    await campaign.methods.contribute().send({
      value: '200',
      from: accounts[1]
    });
    const isContributor = await campaign.methods.approvers(accounts[1]).call();
    expect(isContributor).toBeTruthy()
  });

  it('requires a minimum contribution', async () => {
    try {
      await campaign.methods.contribute().send({
        value: '5',
        from: accounts[1]
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});